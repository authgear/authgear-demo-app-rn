// atob/btoa are used by src/util/jwt.ts but aren't declared by
// @react-native/typescript-config's lib set, which excludes "dom".
declare function atob(data: string): string;
declare function btoa(data: string): string;
