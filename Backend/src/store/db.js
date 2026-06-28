/**
 * In-memory "database".
 * Swap-out point: replace these Maps with real DB calls later
 * (every controller only talks to db.js, never touches Maps directly elsewhere).
 */
const { nanoid } = require("nanoid");

function makeCollection(prefix) {
  const map = new Map();
  return {
    all: () => Array.from(map.values()),
    find: (predicate) => Array.from(map.values()).filter(predicate),
    findOne: (predicate) => Array.from(map.values()).find(predicate),
    get: (id) => map.get(id) || null,
    insert: (data) => {
      const id = data.id || `${prefix}_${nanoid(10)}`;
      const now = new Date().toISOString();
      const record = { ...data, id, createdAt: data.createdAt || now, updatedAt: now };
      map.set(id, record);
      return record;
    },
    update: (id, patch) => {
      const existing = map.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
      map.set(id, updated);
      return updated;
    },
    remove: (id) => map.delete(id),
    clear: () => map.clear(),
    count: () => map.size,
  };
}

const db = {
  users: makeCollection("usr"),
  events: makeCollection("evt"),
  tickets: makeCollection("tkt"), // ticket type definitions per event (VIP, General...)
  registrations: makeCollection("reg"), // a user registering/buying into an event
  checkins: makeCollection("chk"),
  certificates: makeCollection("cert"),
  venues: makeCollection("ven"),
  teamMembers: makeCollection("tm"),
  activity: makeCollection("act"),
  notifications: makeCollection("ntf"),
};

module.exports = db;
