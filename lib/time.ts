export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(total: number) {
  const hours = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (total % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function overlaps(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  return timeToMinutes(startA) < timeToMinutes(endB) && timeToMinutes(startB) < timeToMinutes(endA);
}

export function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

export function isPastSlot(date: string, startTime: string) {
  return combineDateAndTime(date, startTime).getTime() < Date.now();
}

export function formatLongDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(new Date(`${date}T00:00:00`));
}
