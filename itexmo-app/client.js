'use strict';

const ITEXMO_ENDPOINT = 'https://api.itexmo.com/api/broadcast';

function createRequest({ apiCode, clientId, email, password, recipient, message, sender }) {
  const request = {
    ApiCode: apiCode,
    ClientId: clientId,
    Recipients: [recipient],
    Message: message,
    Email: email,
    Password: password,
  };

  if (sender) request.SenderId = sender;
  return request;
}

async function sendBroadcast({ credentials, recipient, message, sender, mock = false }) {
  const request = createRequest({ ...credentials, recipient, message, sender });

  if (mock) {
    return {
      ok: true,
      mock: true,
      message: 'Dry run complete. No SMS was sent.',
      request: { ...request, Password: '[hidden]' },
      testedAt: new Date().toISOString(),
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(ITEXMO_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });
    const text = await response.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text.slice(0, 2000) }; }

    return {
      ok: response.ok,
      status: response.status,
      response: data,
      message: response.ok ? 'iTexMo accepted the request.' : 'iTexMo rejected the request.',
    };
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { ITEXMO_ENDPOINT, createRequest, sendBroadcast };
