export class WhatsAppService {
  static async sendText({ to, text }) {
    // Placeholder: integrate with Meta WhatsApp Business Cloud API
    // Normally POST to https://graph.facebook.com/v17.0/<phone-number-id>/messages with token
    return { ok: true, to, text };
  }
}

export default WhatsAppService;
