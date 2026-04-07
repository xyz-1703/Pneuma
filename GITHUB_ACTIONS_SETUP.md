# GitHub Actions Auto-Deployment Setup Guide

This guide explains how to set up automatic deployment to your VM whenever you push changes to the `main` branch.

## Overview

**What happens:**
1. You push code to `main` branch on GitHub
2. GitHub Actions workflow triggers automatically
3. SSH connects to your VM
4. Pulls latest code, installs dependencies
5. Rebuilds frontend, restarts services
6. Your site is live with new changes

**Total deployment time:** ~2-3 minutes

---

## Setup Steps

### Step 1: Generate SSH Key for GitHub Actions

On your **local machine**, generate a dedicated SSH key:

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/github-actions-key -N ""
```

This creates two files:
- `~/.ssh/github-actions-key` (private key - for GitHub)
- `~/.ssh/github-actions-key.pub` (public key - for VM)

### Step 2: Add Public Key to VM

On your **VM**, authorize this key:

```bash
# Connect to VM
ssh user@your-vm.com

# Add the public key
mkdir -p ~/.ssh
echo "PASTE_CONTENT_OF_github-actions-key.pub_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Exit VM
exit
```

**Quick way:** Copy public key from local machine:
```bash
cat ~/.ssh/github-actions-key.pub | ssh user@your-vm.com 'cat >> ~/.ssh/authorized_keys'
```

### Step 3: Add Secrets to GitHub Repository

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `VM_HOST` | Your VM IP or domain (e.g., `20.41.118.47`, `vm-1.eastus.cloudapp.azure.com`) |
| `VM_USER` | SSH username (e.g., `azureuser`) |
| `VM_SSH_KEY` | **Full content** of `~/.ssh/github-actions-key` (private key) |
| `VM_PORT` | SSH port (default: `22`, only add if different) |

**To copy the private key:**
```bash
cat ~/.ssh/github-actions-key
# Copy entire output including BEGIN and END lines
```

### Step 4: Test the Setup

1. **Make a small change locally**
   ```bash
   cd your-repo
   echo "# Test" >> README.md
   git add .
   git commit -m "Test deployment"
   git push origin main
   ```

2. **Watch deployment in GitHub**
   - Go to repository → **Actions** tab
   - Click the workflow run
   - Watch logs in real-time

3. **Check logs on VM**
   ```bash
   ssh azureuser@your-vm-ip
   sudo journalctl -u pneuma-backend.service -f  # Follow service logs
   ```

---

## Workflow Details

### What the Workflow Does

**File:** `.github/workflows/deploy.yml`

1. **Triggers on:** Push to `main` branch (or manual trigger via Actions tab)
2. **Runs on:** Ubuntu runner
3. **Executes via SSH:**
   - `git pull origin main` - Get latest code
   - `pip install -r requirements.txt` - Update Python packages
   - `npm install && npm run build` - Rebuild frontend
   - `systemctl restart pneuma.service` - Restart backend
   - `systemctl restart nginx` - Restart web server

### Manual Deployment

You can also manually trigger deployment from GitHub:

1. Go to **Actions** tab
2. Click **Deploy to VM** workflow
3. Click **Run workflow** button
4. Select branch and click **Run workflow**

---

## Deployment Script

**File:** `deploy.sh`

This script handles the actual deployment steps. Can be run manually on VM:

```bash
ssh azureuser@your-vm-ip
cd /home/azureuser/Pneuma
sudo ./deploy.sh
```

Features:
- Colored output for better readability
- Error checking at each step
- Service verification
- Automatic logging
- Clear success/failure indicators

---

## Troubleshooting

### ❌ "Permission denied (publickey)"

**Problem:** SSH key setup is incorrect

**Solution:**
1. Verify public key is in VM's `~/.ssh/authorized_keys`
   ```bash
   ssh user@your-vm.com
   cat ~/.ssh/authorized_keys | grep -i "ssh-rsa"
   ```

2. Check private key is added correctly to GitHub secret (copy entire content including "BEGIN RSA" line)

3. Verify `VM_USER` secret matches actual SSH username

### ❌ "Deployment failed" in Actions

**Problem:** Check log output in GitHub Actions

**Solution:**
1. Click the failed run in Actions tab
2. Expand steps to see where it failed
3. Common issues:
   - Database connection failed → Check `DATABASE_URL` in `.env`
   - `npm build` failed → Check frontend code for errors
   - Permission denied on systemctl → VM_USER might not be in sudoers

### ❌ Services won't restart

**Problem:** Gunicorn or Nginx crashed

**Check logs on VM:**
```bash
ssh azureuser@your-vm-ip
sudo systemctl status pneuma-backend.service
sudo journalctl -u pneuma-backend.service -n 20
sudo systemctl status nginx
sudo tail -50 /var/log/nginx/pneuma-error.log
```

### ⚠️ Deployment succeeds but changes don't appear

**Problem:** Nginx is serving old cached files

**Solution:**
```bash
ssh user@your-vm.com
sudo systemctl reload nginx
# Clear browser cache (Ctrl+Shift+Delete)
```

---

## Security Best Practices

✅ **Do:**
- Keep SSH key private (never commit to repo)
- Use strong VM passwords even with key auth
- Restrict SSH access to GitHub's IP ranges (optional but recommended)
- Rotate SSH keys periodically

❌ **Don't:**
- Hardcode secrets in workflow files
- Use your personal SSH key (create dedicated key for GitHub)
- Grant root access unnecessarily

---

## Advanced: Conditional Deployments

To deploy only on specific file changes, modify `.github/workflows/deploy.yml`:

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'backend/**'      # Deploy only if backend files change
      - 'frontend/**'
      - '.github/workflows/deploy.yml'
```

---

## Environment-Specific Deployments

Create multiple workflows for staging/production:

**`.github/workflows/deploy-staging.yml`**
```yaml
on:
  push:
    branches:
      - develop  # Deploy from develop to staging
env:
  VM_HOST: ${{ secrets.STAGING_VM_HOST }}
  VM_USER: ${{ secrets.STAGING_VM_USER }}
  # ... etc
```

---

## Rollback Plan

If deployment goes wrong, SSH into VM and:

```bash
# Revert to previous commit
cd /home/azureuser/Pneuma
git revert HEAD
git pull
sudo ./deploy.sh

# Or rollback completely
git reset --hard HEAD~1
git pull
sudo ./deploy.sh
```

---

## Monitoring Deployments

### View All Deployment History
- GitHub: **Actions** tab → Click **Deploy to VM** workflow
- Shows timestamp, commit, status, duration

### Get Real-Time Notifications
- GitHub: Repository → **Settings** → **Notifications** → Enable workflow notifications
- Or: Configure Discord/Slack webhook in workflow (advanced)

### Check Logs After Deployment
```bash
ssh azureuser@your-vm-ip
sudo journalctl -u pneuma-backend.service -n 10 --no-pager
```

---

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Test with a small commit
3. ✅ Set up branch protection rules (optional)
4. ✅ Monitor first few deployments
5. ✅ Bookmark Actions tab for quick access

**Enjoy automated deployments!** 🚀
