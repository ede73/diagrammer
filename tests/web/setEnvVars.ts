// TODO: Convert to TypeScript

if (!process.env.MINISERVER_TEST_PORT) {
  console.error("MINISERVER TEST PORT NOT SPECIFIED, GUESS ONE")
  process.env.MINISERVER_TEST_PORT = 8001
}
