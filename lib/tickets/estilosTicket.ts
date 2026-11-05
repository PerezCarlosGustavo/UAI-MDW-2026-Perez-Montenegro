import { StyleSheet } from "@react-pdf/renderer";

// Rollo de 58 mm, la impresora del almacén. Los PDF miden en puntos: 58 / 25,4 × 72.
// Sin alto fijo: el papel mide lo que mida el ticket.
export const TAMANO_58MM: [number] = [164.41];

export const estilosTicket = StyleSheet.create({
  page: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 6,
  },
  meta: {
    fontSize: 8,
    marginBottom: 2,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 3,
    marginTop: 8,
    marginBottom: 4,
  },
  column: {
    fontSize: 7,
    fontWeight: "bold",
    flex: 1,
  },
  productRow: {
    flexDirection: "row",
    marginBottom: 3,
    alignItems: "flex-start",
  },
  productName: {
    fontSize: 7,
    flex: 2,
    color: "#000",
  },
  productQty: {
    fontSize: 7,
    flex: 0.7,
    textAlign: "center",
    color: "#000",
  },
  productSubtotal: {
    fontSize: 7,
    flex: 1.3,
    textAlign: "right",
    color: "#000",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: "#000",
  },
  totalLabel: {
    fontSize: 9,
    fontWeight: "bold",
  },
  totalValue: {
    fontSize: 9,
    fontWeight: "bold",
  },
  detalleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
  },
  detalleTexto: {
    fontSize: 8,
  },
});
