export type SectionSnippet = {
  label: string;
  description: string;
  body: string;
};

export const STARTER_TEMPLATE = `{
  "$schema": "openclaw-schema://live/openclaw.schema.json",
  "agents": {
    "defaults": {
      "workspace": "~/.openclaw/workspace"
    }
  },
  "channels": {}
}
`;

export const SECTION_SNIPPETS: SectionSnippet[] = [
  {
    label: "agents.defaults",
    description: "Default agent behavior and workspace.",
    body: `"agents": {
  "defaults": {
    "workspace": "~/.openclaw/workspace",
    "model": {
      "primary": "openai/gpt-5.2"
    }
  }
}`,
  },
  {
    label: "gateway.auth",
    description: "Gateway auth token mode.",
    body: `"gateway": {
  "auth": {
    "mode": "token",
    "token": "\${1:replace-me}"
  }
}`,
  },
  {
    label: "channels.telegram",
    description: "Telegram channel starter block.",
    body: `"channels": {
  "telegram": {
    "enabled": true,
    "botToken": "\${1:123\\:abc}",
    "dmPolicy": "pairing"
  }
}`,
  },
  {
    label: "channels.whatsapp",
    description: "WhatsApp channel starter block.",
    body: `"channels": {
  "whatsapp": {
    "enabled": true,
    "dmPolicy": "allowlist",
    "allowFrom": ["\${1:+15555550123}"]
  }
}`,
  },
];
