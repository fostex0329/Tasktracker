"use client";

function getDateInfo(todo) {
  if (!todo || !todo.remindAt) {
    return { hasDate: false };
  }
  const date = new Date(todo.remindAt);
  if (Number.isNaN(date.getTime())) {
    return { hasDate: false };
  }
  const dayValue = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  let hasTime;
  if (todo.remindHasTime === false) {
    hasTime = false;
  } else if (todo.remindHasTime === true) {
    hasTime = true;
  } else {
    hasTime = hours !== 0 || minutes !== 0 || seconds !== 0;
  }
  return {
    hasDate: true,
    dayValue,
    hasTime,
    timestamp: date.getTime(),
  };
}

export function compareTodos(a, b) {
  const aInfo = getDateInfo(a);
  const bInfo = getDateInfo(b);

  if (aInfo.hasDate !== bInfo.hasDate) {
    return aInfo.hasDate ? 1 : -1;
  }
  if (!aInfo.hasDate && !bInfo.hasDate) {
    return 0;
  }

  if (aInfo.dayValue !== bInfo.dayValue) {
    return aInfo.dayValue - bInfo.dayValue;
  }

  if (aInfo.hasTime !== bInfo.hasTime) {
    return aInfo.hasTime ? 1 : -1;
  }

  if (!aInfo.hasTime && !bInfo.hasTime) {
    return 0;
  }

  return aInfo.timestamp - bInfo.timestamp;
}

export function sortTodos(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const diff = compareTodos(a.item, b.item);
      if (diff !== 0) return diff;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}
