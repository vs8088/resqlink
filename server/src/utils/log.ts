export const log = (label: string, payload: unknown) => {
  // eslint-disable-next-line no-console
  console.log(`[${label}]`, payload);
};

export const logEvent = (event: string, payload: Record<string, unknown>) => {
  const entry = {
    event,
    ts: new Date().toISOString(),
    ...payload
  };

  // eslint-disable-next-line no-console
  console.log(JSON.stringify(entry));
};
