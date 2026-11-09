
(() => {
  // Set this to the deployed Render backend URL, without a trailing slash.
  const API_URL = "https://abdulhanan-portfolio-agent.onrender.com";
  const launcher = document.getElementById("agentLauncher");
  const panel = document.getElementById("agentPanel");
  const close = document.getElementById("agentClose");
  const form = document.getElementById("agentForm");
  const input = document.getElementById("agentInput");
  const messages = document.getElementById("agentMessages");
  const suggestions = document.querySelector(".agent-suggestions");
  const history = [];

  function toggle(open) {
    panel.classList.toggle("is-open", open);
    panel.setAttribute("aria-hidden", String(!open));
    launcher.setAttribute("aria-expanded", String(open));
    if (open) input.focus();
  }

  function renderAssistantText(node, text) {
  if (window.marked && window.DOMPurify) {
    const html = window.marked.parse(text, {
      gfm: true,
      breaks: false
    });

    node.innerHTML = window.DOMPurify.sanitize(html);

    node.querySelectorAll("a").forEach(link => {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    });
  } else {
    node.textContent = text;
  }
}

function addMessage(text, role, extraClass = "") {
  const node = document.createElement("div");
  node.className = `agent-message ${role} ${extraClass}`.trim();

  if (role === "assistant") {
    renderAssistantText(node, text);
  } else {
    node.textContent = text;
  }

  messages.appendChild(node);
  messages.scrollTop = messages.scrollHeight;
  return node;
}

  async function ask(question) {
    addMessage(question, "user");
    history.push({ role: "user", text: question });
    const pending = addMessage("Thinking…", "assistant");
    input.disabled = true;
    form.querySelector("button").disabled = true;

    try {
      if (API_URL.includes("YOUR-PORTFOLIO-AGENT")) {
        throw new Error("The AI assistant backend has not been configured yet. Deploy the backend and update API_URL in js/agent.js.");
      }
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question, history: history.slice(-10, -1) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The assistant could not respond. Please try again.");
      pending.textContent = data.reply || "I couldn't generate a response. Please try again.";
      history.push({ role: "assistant", text: pending.textContent });
    } catch (error) {
      pending.textContent = error.message || "Something went wrong. Please try again.";
      pending.classList.add("error");
      history.pop();
    } finally {
      input.disabled = false;
      form.querySelector("button").disabled = false;
      input.focus();
      messages.scrollTop = messages.scrollHeight;
    }
  }

  launcher.addEventListener("click", () => toggle(!panel.classList.contains("is-open")));
  close.addEventListener("click", () => toggle(false));
  form.addEventListener("submit", event => {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    input.value = "";
    ask(question);
  });
  suggestions.addEventListener("click", event => {
    const button = event.target.closest("button[data-prompt]");
    if (!button) return;
    const question = button.dataset.prompt;
    toggle(true);
    ask(question);
  });
})();
