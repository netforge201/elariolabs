declare module 'bcryptjs' {
  interface Bcrypt {
    hash(value: string, rounds: number): Promise<string>;
    compare(value: string, encoded: string): Promise<boolean>;
  }
  const bcrypt: Bcrypt;
  export default bcrypt;
}
