export default {
  '*.{ts,tsx}': ['oxlint', 'oxfmt --write'],
  '*.{json,md,yml,yaml}': ['oxfmt --write']
};
