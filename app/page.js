"use client";

import { useState } from "react";

const habitaciones = [
  {
    numero: 1,
    tipo: "Matrimonial / Triple",
    camas: "1 matrimonial + 1 individual",
    capacidad: 3,
  },
  {
    numero: 2,
    tipo: "Single / Matrimonial",
    camas: "1 matrimonial",
    capacidad: 2,
  },
  {
    numero: 3,
    tipo: "Matrimonial / Suite",
    camas: "1 matrimonial",
    capacidad: 2,
  },
  {
    numero: 4,
    tipo: "Matrimonial",
    camas: "1 matrimonial",
    capacidad: 2,
  },
  {
    numero: 5,
    tipo: "Matrimonial / Familiar",
    camas: "2 matrimoniales + 3 individuales",
    capacidad: 7,
  },
];

export default function Home() {
  const [ingreso, setIngreso] = useState(false);

  if (!ingreso) {
    return (
      <main style={styles.inicio}>
        <section style={styles.portada}>
          <div style={styles.hotel}>HOTEL</div>

          <h1 style={styles.logo}>JABIRÚ</h1>

          <p style={styles.subtitulo}>Gestión del hotel</p>

          <button
            type="button"
            style={styles.botonPrincipal}
            onClick={() => setIngreso(true)}
          >
            INGRESAR
          </button>

          <p style={styles.pie}>Sistema de administración</p>
        </section>
      </main>
    );
  }

  return (
    <main style={styles.panel}>
      <section style={styles.contenedor}>
        <header style={styles.cabecera}>
          <div>
            <div style={styles.hotel}>HOTEL</div>
            <h1 style={styles.tituloPanel}>JABIRÚ</h1>
          </div>

          <button
            type="button"
            style={styles.salir}
            onClick={() => setIngreso(false)}
          >
            Salir
          </button>
        </header>

        <h2 style={styles.bienvenida}>Administración</h2>
        <p style={styles.fecha}>Habitaciones del hotel</p>

        <section style={styles.resumen}>
          <div style={styles.tarjetaResumen}>
            <strong style={styles.numeroGrande}>5</strong>
            <span style={styles.textoResumen}>Habitaciones</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong style={styles.numeroGrande}>12:00</strong>
            <span style={styles.textoResumen}>Check-in</span>
          </div>

          <div style={styles.tarjetaResumen}>
            <strong style={styles.numeroGrande}>10:00</strong>
            <span style={styles.textoResumen}>Check-out</span>
          </div>
        </section>

        <button type="button" style={styles.nuevaReserva}>
          + NUEVA RESERVA
        </button>

        <h3 style={styles.seccionTitulo}>Habitaciones</h3>

        <section style={styles.lista}>
          {habitaciones.map((habitacion) => (
            <article key={habitacion.numero} style={styles.habitacion}>
              <div style={styles.numeroHabitacion}>
                {habitacion.numero}
              </div>

              <div style={styles.infoHabitacion}>
                <strong style={styles.tipo}>{habitacion.tipo}</strong>

                <span style={styles.detalle}>
                  {habitacion.camas}
                </span>

                <span style={styles.capacidad}>
                  Hasta {habitacion.capacidad}{" "}
                  {habitacion.capacidad === 1 ? "persona" : "personas"}
                </span>
              </div>

              <div style={styles.disponible}>Disponible</div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}

const styles = {
  inicio: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    background: "linear-gradient(180deg, #F5F0E6 0%, #E8DFCF 100%)",
    fontFamily: "Arial, sans-serif",
  },

  portada: {
    width: "100%",
    maxWidth: "430px",
    textAlign: "center",
  },

  hotel: {
    fontSize: "12px",
    letterSpacing: "4px",
    color: "#9A8155",
    marginBottom: "10px",
  },

  logo: {
    margin: 0,
    fontSize: "48px",
    fontWeight: "600",
    letterSpacing: "3px",
    color: "#394332",
  },

  subtitulo: {
    marginTop: "12px",
    marginBottom: "40px",
    fontSize: "16px",
    color: "#706857",
  },

  botonPrincipal: {
    width: "100%",
    padding: "17px",
    border: "none",
    borderRadius: "12px",
    backgroundColor: "#4E5B43",
    color: "#FFFFFF",
    fontSize: "17px",
    fontWeight: "600",
    cursor: "pointer",
  },

  pie: {
    marginTop: "28px",
    fontSize: "12px",
    color: "#948B7A",
  },

  panel: {
    minHeight: "100vh",
    backgroundColor: "#F5F0E6",
    fontFamily: "Arial, sans-serif",
    color: "#394332",
  },

  contenedor: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "24px 18px 50px",
  },

  cabecera: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "20px",
    borderBottom: "1px solid #D8CEBD",
  },

  tituloPanel: {
    margin: 0,
    fontSize: "28px",
    letterSpacing: "2px",
  },

  salir: {
    border: "1px solid #B8AC98",
    backgroundColor: "transparent",
    borderRadius: "9px",
    padding: "9px 14px",
    color: "#706857",
    cursor: "pointer",
  },

  bienvenida: {
    fontSize: "28px",
    marginBottom: "5px",
    marginTop: "28px",
  },

  fecha: {
    color: "#817866",
    marginTop: 0,
    marginBottom: "22px",
  },

  resumen: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "20px",
  },

  tarjetaResumen: {
    backgroundColor: "#FFFFFF",
    borderRadius: "12px",
    padding: "15px 8px",
    textAlign: "center",
    boxShadow: "0 2px 10px rgba(60, 50, 35, 0.05)",
  },

  numeroGrande: {
    display: "block",
    fontSize: "19px",
    color: "#4E5B43",
  },

  textoResumen: {
    display: "block",
    marginTop: "5px",
    fontSize: "11px",
    color: "#857D6E",
  },

  nuevaReserva: {
    width: "100%",
    padding: "16px",
    border: "none",
    borderRadius: "11px",
    backgroundColor: "#4E5B43",
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: "15px",
    cursor: "pointer",
    marginBottom: "30px",
  },

  seccionTitulo: {
    marginBottom: "12px",
    fontSize: "19px",
  },

  lista: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },

  habitacion: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    backgroundColor: "#FFFFFF",
    padding: "15px",
    borderRadius: "12px",
    boxShadow: "0 2px 10px rgba(60, 50, 35, 0.05)",
  },

  numeroHabitacion: {
    width: "42px",
    height: "42px",
    flexShrink: 0,
    borderRadius: "50%",
    backgroundColor: "#E7E2D4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: "700",
    color: "#4E5B43",
  },

  infoHabitacion: {
    flex: 1,
    minWidth: 0,
  },

  tipo: {
    display: "block",
    fontSize: "14px",
    marginBottom: "4px",
  },

  detalle: {
    display: "block",
    fontSize: "12px",
    color: "#817866",
  },

  capacidad: {
    display: "block",
    marginTop: "3px",
    fontSize: "11px",
    color: "#9A927F",
  },

  disponible: {
    fontSize: "10px",
    fontWeight: "700",
    color: "#5D704E",
    backgroundColor: "#EDF1E9",
    padding: "6px 7px",
    borderRadius: "20px",
    whiteSpace: "nowrap",
  },
};
