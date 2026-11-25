// DAPUR KILAT — orders.js
// One job: the order board — which tickets are up, how long each customer waits,
// and what serving a dish earns. It knows nothing about drawing or input.

import { DISHES, DISH_BY_ID, MAX_ORDERS, patienceFor, spawnEveryFor, tipFor } from './config.js';

let nextId = 1;

/** A fresh ticket: a random dish, full patience, born at `elapsed` seconds in. */
function makeOrder(elapsed, rng) {
  const dish = DISHES[Math.floor(rng() * DISHES.length)];
  const patience = patienceFor(elapsed);
  return { id: nextId, dishId: dish.id, patience, patienceMax: patience, born: elapsed };
}

export function createOrderBoard(rng) {
  return {
    rng,
    orders: [],
    spawnIn: 1.5, // first ticket arrives almost at once
    served: 0,
    missed: 0,
  };
}

/** Start a day with two tickets already on the board. */
export function resetBoard(board, elapsed) {
  board.orders = [makeOrder(elapsed, board.rng), makeOrder(elapsed, board.rng)];
  board.spawnIn = spawnEveryFor(elapsed);
  board.served = 0;
  board.missed = 0;
}

/**
 * Advance the board by `dt` seconds. Returns the tickets that expired this step
 * (their customers walked out) so the kitchen can react.
 */
export function tickBoard(board, dt, elapsed) {
  const expired = [];
  for (const order of board.orders) {
    order.patience -= dt;
    if (order.patience <= 0) expired.push(order);
  }
  if (expired.length) {
    const gone = new Set(expired.map((o) => o.id));
    board.orders = board.orders.filter((o) => !gone.has(o.id));
    board.missed += expired.length;
  }
  board.spawnIn -= dt;
  if (board.spawnIn <= 0 && board.orders.length < MAX_ORDERS) {
    board.orders.push(makeOrder(elapsed, board.rng));
    board.spawnIn = spawnEveryFor(elapsed);
  } else if (board.orders.length >= MAX_ORDERS) {
    board.spawnIn = Math.min(board.spawnIn, 2);
  }
  return expired;
}

/** The oldest ticket waiting for `dishId`, or null. */
export function findOrderFor(board, dishId) {
  return board.orders.find((o) => o.dishId === dishId) ?? null;
}

/**
 * Serve `dishId`: remove the oldest matching ticket and pay price + tip for the
 * patience left. Returns the payment, or null when no ticket wants the dish.
 */
export function serveOrder(board, dishId) {
  const order = findOrderFor(board, dishId);
  if (!order) return null;
  board.orders = board.orders.filter((o) => o.id !== order.id);
  board.served += 1;
  const dish = DISH_BY_ID[dishId];
  const fraction = Math.max(0, order.patience / order.patienceMax);
  const tip = tipFor(dish.price, fraction);
  return { dish, price: dish.price, tip, total: dish.price + tip, fraction };
}
