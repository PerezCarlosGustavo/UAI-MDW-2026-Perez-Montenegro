import { describe, expect, it } from "vitest";
import { actualizarUsuarioSchema } from "@/lib/schemas/usuario";
import { validarCambioDeUsuario } from "./reglas";

describe("validarCambioDeUsuario", () => {
  it("deja que un ADMIN apruebe a otro usuario como VENDEDOR", () => {
    expect(validarCambioDeUsuario(5, 1, { rol: "VENDEDOR" }).ok).toBe(true);
  });

  it("deja que un ADMIN desactive a otro usuario", () => {
    expect(validarCambioDeUsuario(5, 1, { activo: false }).ok).toBe(true);
  });

  it("no deja que un ADMIN se saque el rol a sí mismo", () => {
    expect(validarCambioDeUsuario(1, 1, { rol: "VENDEDOR" }).ok).toBe(false);
  });

  it("no deja que un ADMIN se desactive a sí mismo", () => {
    expect(validarCambioDeUsuario(1, 1, { activo: false }).ok).toBe(false);
  });

  it("borde: reasignarse ADMIN a sí mismo no cambia nada y se permite", () => {
    expect(validarCambioDeUsuario(1, 1, { rol: "ADMIN", activo: true }).ok).toBe(true);
  });
});

describe("actualizarUsuarioSchema", () => {
  it("rechaza un rol que no existe", () => {
    expect(actualizarUsuarioSchema.safeParse({ rol: "SUPERADMIN" }).success).toBe(false);
  });

  it("rechaza un body vacío", () => {
    expect(actualizarUsuarioSchema.safeParse({}).success).toBe(false);
  });

  it("rechaza campos que no se pueden cambiar, como el email", () => {
    expect(
      actualizarUsuarioSchema.safeParse({ rol: "VENDEDOR", email: "otro@gmail.com" }).success
    ).toBe(false);
  });
});
