it('unit tests run outside UTC, so local/UTC date mix-ups fail here', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})
