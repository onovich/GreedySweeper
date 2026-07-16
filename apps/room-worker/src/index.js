export class RoomDurableObject {
  constructor(state) {
    this.state = state;
  }
  async fetch() {
    return Response.json({ status: 'foundation' });
  }
}
export default {
  async fetch(request) {
    const url = new URL(request.url);
    return url.pathname === '/health'
      ? Response.json({ status: 'ok', onlineProtocol: '1' })
      : new Response('Not found', { status: 404 });
  },
};
