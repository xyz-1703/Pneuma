from langchain.memory import ConversationBufferMemory
from langchain_core.messages import AIMessage, HumanMessage


def build_conversation_memory(history_rows: list[dict]) -> ConversationBufferMemory:
    memory = ConversationBufferMemory(return_messages=True, memory_key="chat_history")

    for row in history_rows[-10:]:
        role = row.get("role", "user")
        content = row.get("message", "")
        if not content:
            continue

        if role == "assistant":
            memory.chat_memory.add_message(AIMessage(content=content))
        else:
            memory.chat_memory.add_message(HumanMessage(content=content))

    return memory


def memory_to_history_text(memory: ConversationBufferMemory) -> str:
    vars_dict = memory.load_memory_variables({})
    messages = vars_dict.get("chat_history", [])
    if not messages:
        return "No previous conversation."

    lines = []
    for msg in messages:
        if isinstance(msg, AIMessage):
            lines.append(f"assistant: {msg.content}")
        elif isinstance(msg, HumanMessage):
            lines.append(f"user: {msg.content}")

    return "\n".join(lines) if lines else "No previous conversation."
