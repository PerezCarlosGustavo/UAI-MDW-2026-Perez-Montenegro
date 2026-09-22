export class ErrorAutorizacion extends Error {
  constructor(
    public readonly status: 401 | 403,
    message: string
  ) {
    super(message);
    this.name = "ErrorAutorizacion";
  }
}

export function respuestaErrorAutorizacion(error: unknown) {
  if (!(error instanceof ErrorAutorizacion)) {
    return null;
  }

  return Response.json(
    { error: error.message },
    { status: error.status }
  );
}