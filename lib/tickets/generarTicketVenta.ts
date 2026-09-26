import { promises as fs } from "node:fs";
import path from "node:path";
import * as React from "react";
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

export type ProductoTicket = {
  nombre: string;
  cantidad: number;
  subtotal: number;
};

export type GenerarTicketVentaInput = {
  ventaId: bigint;
  productos: ProductoTicket[];
  total: number;
  fecha?: Date;
  destino?: string;
};

export async function generarTicketVentaPdf({
  ventaId,
  productos,
  total,
  fecha = new Date(),
  destino,
}: GenerarTicketVentaInput): Promise<Buffer> {
  const styles = StyleSheet.create({
    page: {
      padding: 18,
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
    },
    title: {
      fontSize: 18,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 8,
    },
    meta: {
      fontSize: 9,
      marginBottom: 4,
    },
    tableHeader: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#333",
      paddingBottom: 4,
      marginTop: 12,
      marginBottom: 6,
    },
    column: {
      fontSize: 8,
      fontWeight: "bold",
      flex: 1,
    },
    productRow: {
      flexDirection: "row",
      marginBottom: 4,
      alignItems: "center",
    },
    productName: {
      fontSize: 8,
      flex: 2,
      color: "#111",
    },
    productQty: {
      fontSize: 8,
      flex: 0.8,
      textAlign: "center",
      color: "#111",
    },
    productSubtotal: {
      fontSize: 8,
      flex: 1,
      textAlign: "right",
      color: "#111",
    },
    totalRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: "#333",
    },
    totalLabel: {
      fontSize: 10,
      fontWeight: "bold",
    },
    totalValue: {
      fontSize: 10,
      fontWeight: "bold",
    },
  });

  const TicketDocument = () =>
    React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: "A6", style: styles.page },
        React.createElement(Text, { style: styles.title }, "Ticket de venta"),
        React.createElement(Text, { style: styles.meta }, `ID Venta: ${String(ventaId)}`),
        React.createElement(Text, { style: styles.meta }, `Fecha: ${new Date(fecha).toLocaleString("es-AR")}`),
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(Text, { style: [styles.column, { flex: 2 }] }, "Producto"),
          React.createElement(Text, { style: [styles.column, { flex: 0.8, textAlign: "center" }] }, "Cant."),
          React.createElement(Text, { style: [styles.column, { textAlign: "right" }] }, "Subtotal")
        ),
        ...productos.map((producto, index) =>
          React.createElement(
            View,
            { key: `${producto.nombre}-${index}`, style: styles.productRow },
            React.createElement(Text, { style: styles.productName }, String(producto.nombre)),
            React.createElement(Text, { style: styles.productQty }, String(producto.cantidad)),
            React.createElement(Text, { style: styles.productSubtotal }, `$ ${producto.subtotal.toFixed(2)}`)
          )
        ),
        React.createElement(
          View,
          { style: styles.totalRow },
          React.createElement(Text, { style: styles.totalLabel }, "Total"),
          React.createElement(Text, { style: styles.totalValue }, `$ ${total.toFixed(2)}`)
        )
      )
    );

  return Buffer.from(await renderToBuffer(React.createElement(TicketDocument)));
;
}
