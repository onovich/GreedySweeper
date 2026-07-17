export class RoomDurableObject {
  constructor(state) {
    this.state = state;
  }
  async initialize() {
    const sql = this.state.storage.sql;
    sql.exec(
      'CREATE TABLE IF NOT EXISTS room_foundation (id INTEGER PRIMARY KEY, value TEXT NOT NULL)',
    );
    sql.exec("INSERT OR IGNORE INTO room_foundation (id, value) VALUES (1, 'initialized')");
  }
  async fetch() {
    await this.initialize();
    return Response.json({ status: 'foundation', storage: 'sqlite' });
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
