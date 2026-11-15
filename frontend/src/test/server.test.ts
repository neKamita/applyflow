describe('MSW test server', () => {
  it('rejects requests that no test mocked', async () => {
    // example.invalid never resolves in DNS, so only MSW's "error" strategy can produce this cause.
    const failure = await fetch('https://example.invalid/api/programs').catch((error: unknown) => error)

    expect(failure).toBeInstanceOf(TypeError)
    expect(String((failure as TypeError).cause)).toContain('"error" strategy')
  })
})
