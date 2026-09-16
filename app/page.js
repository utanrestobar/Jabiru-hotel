"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://xbnmzreihrxjsktlpcns.supabase.co";
const SUPABASE_KEY = "sb_publishable_9-xANiS8jgcoITOYNGrQtg_3MWUZpm8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default function Home() {
  const [ingreso, setIngreso] = useState(false);
  const [habitaciones, setHabitaciones] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarReserva, setMostrarReserva] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const [form, setForm] = useState({
    habitacion_id: "",
    huesped_principal: "",
    telefono: "",
    fecha_entrada: "",
    fecha_salida: "",
    adultos: 1,
    ninos_0_6: 0,
    ninos_7_10: 0,
    observaciones: "",
  });

  async function cargarDatos() {
    setCargando(true);
    setMensaje("");

    const [respuestaHabitaciones, respuestaReservas] = await Promise.all([
      supabase
        .from("habitaciones")
        .select("*")
        .eq("activa", true)
        .order("numero", { ascending: true }),

      supabase
        .from("reservas")
        .select("*")
        .neq("estado", "cancelada")
        .order("fecha_entrada", { ascending: true }),
    ]);

    if (respuestaHabitaciones.error || respuestaReservas.error) {
      setMensaje(
        "Error de conexión: " +
          (
            respuestaHabitaciones.error ||
            respuestaReservas.error
          )?.message
      );
    } else {
      setHabitaciones(respuestaHabitaciones.data || []);
      setReservas(respuestaReservas.data || []);
    }

    setCargando(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  const hoy = new Date().toISOString().slice(0, 10);

  const habitacionesOcupadas = useMemo(() => {
    return new Set(
      reservas
        .filter(
          (reserva) =>
            reserva.fecha_entrada <= hoy &&
            reserva.fecha_salida > hoy &&
            reserva.estado !== "cancelada"
        )
        .map((reserva) => reserva.habitacion_id)
    );
  }, [reservas, hoy]);

  const totalPersonas =
    Number(form.adultos || 0) +
    Number(form.ninos_0_6 || 0) +
    Number(form.ninos_7_10 || 0);

  const habitacionSeleccionada = habitaciones.find(
    (habitacion) =>
      String(habitacion.id) === String(form.habitacion_id)
  );

  function precioPorCantidad(cantidad) {
    const precios = {
      1: 200000,
      2: 400000,
      3: 540000,
      4: 760000,
      5: 950000,
      6: 1140000,
      7: 1330000,
    };

    return precios[cantidad] || 0;
  }

  function calcularTotal() {
    const adultos = Number(form.adultos || 0);
    const ninosMedios = Number(form.ninos_7_10 || 0);

    const precioAdultos = precioPorCantidad(adultos);

    const precioIndividual =
      adultos > 0
        ? precioAdultos / adultos
        : precioPorCantidad(1);

    return Math.round(
      precioAdultos + ninosMedios * precioIndividual * 0.5
    );
  }

  function formatoGs(valor) {
    return new Intl.NumberFormat("es-PY").format(valor || 0) + " Gs";
  }

  async function guardarReserva(evento) {
    evento.preventDefault();
    setMensaje("");

    if (!form.habitacion_id) {
      setMensaje("Seleccioná una habitación.");
      return;
    }

    if (!form.huesped_principal.trim()) {
      setMensaje("Ingresá el nombre del huésped.");
      return;
    }

    if (!form.fecha_entrada || !form.fecha_salida) {
      setMensaje("Completá la fecha de entrada y salida.");
      return;
    }

    if (form.fecha_salida <= form.fecha_entrada) {
      setMensaje(
        "La fecha de salida debe ser posterior a la entrada."
      );
      return;
    }

    if (totalPersonas < 1) {
      setMensaje("Debe haber al menos una persona.");
      return;
    }

    if (
      habitacionSeleccionada &&
      totalPersonas > habitacionSeleccionada.capacidad_maxima
    ) {
      setMensaje(
        `La habitación ${habitacionSeleccionada.numero} admite como máximo ${habitacionSeleccionada.capacidad_maxima} personas.`
      );
      return;
    }

    const total = calcularTotal();

    const { error } = await supabase.from("reservas").insert({
      habitacion_id: Number(form.habitacion_id),
      huesped_principal: form.huesped_principal.trim(),
      telefono: form.telefono.trim() || null,
      fecha_entrada: form.fecha_entrada,
      fecha_salida: form.fecha_salida,
      adultos: Number(form.adultos || 0),
      ninos_0_6: Number(form.ninos_0_6 || 0),
      ninos_7_10: Number(form.ninos_7_10 || 0),
      total_personas: totalPersonas,
      precio_base: total,
      descuento: 0,
      total,
      estado: "reservada",
      estado_pago: "pendiente",
      desayuno: true,
      observaciones: form.observaciones.trim() || null,
    });

    if (error) {
      if (
        error.code === "23P01" ||
        error.message?.toLowerCase().includes("conflict") ||
        error.message?.toLowerCase().includes("exclusion")
      ) {
        setMensaje(
          "Esa habitación ya tiene una reserva en esas fechas."
        );
      } else {
        setMensaje("No se pudo guardar: " + error.message);
      }

      return;
    }

    setForm({
      habitacion_id: "",
      huesped_principal: "",
      telefono: "",
      fecha_entrada: "",
      fecha_salida: "",
      adultos: 1,
      ninos_0_6: 0,
      ninos_7_10: 0,
      observaciones: "",
    });

    setMostrarReserva(false);
    setMensaje("Reserva guardada correctamente.");

    await cargarDatos();
  }

  if (!ingreso) {
    return (
      <main style={estilos.portada}>
        <section style={estilos.centro}>
          <div style={estilos.hotel}>HOTEL BOUTIQUE</div>

          <h1 style={estilos.logo}>JABIRÚ</h1>

          <p style={estilos.subtitulo}>Gestión del hotel</p>

          <button
            type="button"
            style={estilos.botonPrincipal}
            onClick={() => setIngreso(true)}
          >
            INGRESAR
          </button>

          <p style={estilos.pie}>
            Sistema de administración
          </p>
        </section>
      </main>
    );
  }

  return (
    <main style={estilos.app}>
      <section style={estilos.contenedor}>
        <header style={estilos.header}>
          <div>
            <div style={estilos.hotel}>HOTEL BOUTIQUE</div>
            <h1 style={estilos.titulo}>JABIRÚ</h1>
          </div>

          <button
            type="button"
            style={estilos.botonSalir}
            onClick={() => setIngreso(false)}
          >
            Salir
          </button>
        </header>

        <h2 style={estilos.h2}>Administración</h2>

        {mensaje && (
          <div style={estilos.mensaje}>{mensaje}</div>
        )}

        <div style={estilos.resumen}>
          <div style={estilos.tarjetaResumen}>
            <strong style={estilos.numero}>
              {habitaciones.length}
            </strong>
            <span>Habitaciones</span>
          </div>

          <div style={estilos.tarjetaResumen}>
            <strong style={estilos.numero}>
              {habitacionesOcupadas.size}
            </strong>
            <span>Ocupadas hoy</span>
          </div>

          <div style={estilos.tarjetaResumen}>
            <strong style={estilos.numero}>
              {Math.max(
                habitaciones.length -
                  habitacionesOcupadas.size,
                0
              )}
            </strong>
            <span>Disponibles</span>
          </div>
        </div>

        <button
          type="button"
          style={estilos.botonPrincipal}
          onClick={() => {
            setMensaje("");
            setMostrarReserva(!mostrarReserva);
          }}
        >
          {mostrarReserva
            ? "CERRAR"
            : "+ NUEVA RESERVA"}
        </button>

        {mostrarReserva && (
          <form
            style={estilos.formulario}
            onSubmit={guardarReserva}
          >
            <h3 style={{ marginTop: 0 }}>
              Nueva reserva
            </h3>

            <label style={estilos.label}>
              Habitación
            </label>

            <select
              style={estilos.input}
              value={form.habitacion_id}
              onChange={(e) =>
                setForm({
                  ...form,
                  habitacion_id: e.target.value,
                })
              }
              required
            >
              <option value="">
                Seleccionar habitación
              </option>

              {habitaciones.map((habitacion) => (
                <option
                  key={habitacion.id}
                  value={habitacion.id}
                >
                  Habitación {habitacion.numero} —{" "}
                  {habitacion.tipo}
                </option>
              ))}
            </select>

            <label style={estilos.label}>
              Huésped principal
            </label>

            <input
              style={estilos.input}
              value={form.huesped_principal}
              onChange={(e) =>
                setForm({
                  ...form,
                  huesped_principal: e.target.value,
                })
              }
              placeholder="Nombre y apellido"
              required
            />

            <label style={estilos.label}>
              Teléfono
            </label>

            <input
              style={estilos.input}
              type="tel"
              value={form.telefono}
              onChange={(e) =>
                setForm({
                  ...form,
                  telefono: e.target.value,
                })
              }
              placeholder="Número de teléfono"
            />

            <div style={estilos.dosColumnas}>
              <div>
                <label style={estilos.label}>
                  Entrada
                </label>

                <input
                  style={estilos.input}
                  type="date"
                  value={form.fecha_entrada}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fecha_entrada: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label style={estilos.label}>
                  Salida
                </label>

                <input
                  style={estilos.input}
                  type="date"
                  value={form.fecha_salida}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      fecha_salida: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div style={estilos.tresColumnas}>
              <div>
                <label style={estilos.label}>
                  Adultos / 11+
                </label>

                <input
                  style={estilos.input}
                  type="number"
                  min="0"
                  value={form.adultos}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      adultos: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={estilos.label}>
                  Niños 0–6
                </label>

                <input
                  style={estilos.input}
                  type="number"
                  min="0"
                  value={form.ninos_0_6}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ninos_0_6: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label style={estilos.label}>
                  Niños 7–10
                </label>

                <input
                  style={estilos.input}
                  type="number"
                  min="0"
                  value={form.ninos_7_10}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      ninos_7_10: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div style={estilos.info}>
              Huéspedes: <strong>{totalPersonas}</strong>
              <br />
              Niños 0–6: sin cargo
              <br />
              Niños 7–10: 50%
              <br />
              Total estimado:{" "}
              <strong>
                {formatoGs(calcularTotal())}
              </strong>
            </div>

            <label style={estilos.label}>
              Observaciones
            </label>

            <textarea
              style={{
                ...estilos.input,
                minHeight: 80,
              }}
              value={form.observaciones}
              onChange={(e) =>
                setForm({
                  ...form,
                  observaciones: e.target.value,
                })
              }
              placeholder="Observaciones"
            />

            <button
              type="submit"
              style={estilos.botonGuardar}
            >
              GUARDAR RESERVA
            </button>
          </form>
        )}

        <h3 style={estilos.seccion}>
          Habitaciones
        </h3>

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          habitaciones.map((habitacion) => {
            const ocupada =
              habitacionesOcupadas.has(habitacion.id);

            return (
              <div
                key={habitacion.id}
                style={estilos.habitacion}
              >
                <div style={estilos.circulo}>
                  {habitacion.numero}
                </div>

                <div style={{ flex: 1 }}>
                  <strong style={estilos.tipo}>
                    {habitacion.tipo}
                  </strong>

                  <span style={estilos.detalle}>
                    {habitacion.camas_matrimoniales >
                      0 &&
                      `${habitacion.camas_matrimoniales} matrimonial${
                        habitacion.camas_matrimoniales >
                        1
                          ? "es"
                          : ""
                      }`}

                    {habitacion.camas_matrimoniales >
                      0 &&
                      habitacion.camas_individuales >
                        0 &&
                      " + "}

                    {habitacion.camas_individuales >
                      0 &&
                      `${habitacion.camas_individuales} individual${
                        habitacion.camas_individuales >
                        1
                          ? "es"
                          : ""
                      }`}
                  </span>

                  <span style={estilos.detalle}>
                    Máximo{" "}
                    {habitacion.capacidad_maxima}{" "}
                    personas
                  </span>
                </div>

                <span
                  style={{
                    ...estilos.estado,
                    background: ocupada
                      ? "#F3E3DF"
                      : "#EAF0E6",
                    color: ocupada
                      ? "#A35C4E"
                      : "#55704C",
                  }}
                >
                  {ocupada
                    ? "Ocupada"
                    : "Disponible"}
                </span>
              </div>
            );
          })
        )}

        <h3 style={estilos.seccion}>
          Reservas
        </h3>

        {reservas.length === 0 ? (
          <div style={estilos.vacio}>
            Todavía no hay reservas.
          </div>
        ) : (
          reservas.slice(0, 20).map((reserva) => {
            const habitacion = habitaciones.find(
              (h) => h.id === reserva.habitacion_id
            );

            return (
              <div
                key={reserva.id}
                style={estilos.reserva}
              >
                <div>
                  <strong>
                    {reserva.huesped_principal}
                  </strong>

                  <span style={estilos.detalle}>
                    Habitación{" "}
                    {habitacion?.numero || "—"} ·{" "}
                    {reserva.total_personas} huésped
                    {reserva.total_personas !== 1
                      ? "es"
                      : ""}
                  </span>

                  <span style={estilos.detalle}>
                    {reserva.fecha_entrada} →{" "}
                    {reserva.fecha_salida}
                  </span>

                  <span style={estilos.detalle}>
                    {formatoGs(reserva.total)}
                  </span>
                </div>

                <span style={estilos.estado}>
                  {reserva.estado}
                </span>
              </div>
            );
          })
        )}
      </section>
    </main>
  );
}

const estilos = {
  portada: {
    minHeight: "100vh",
    background:
      "linear-gradient(180deg,#F5F0E6,#E7DECE)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    fontFamily: "Arial,sans-serif",
  },

  centro: {
    width: "100%",
    maxWidth: 430,
    textAlign: "center",
  },

  hotel: {
    fontSize: 11,
    letterSpacing: 4,
    color: "#987F52",
    marginBottom: 8,
  },

  logo: {
    margin: 0,
    fontSize: 48,
    letterSpacing: 3,
    color: "#394332",
  },

  subtitulo: {
    color: "#706857",
    margin: "12px 0 38px",
  },

  pie: {
    color: "#948B7A",
    fontSize: 12,
    marginTop: 25,
  },

  botonPrincipal: {
    width: "100%",
    border: 0,
    borderRadius: 12,
    padding: 16,
    background: "#4E5B43",
    color: "#FFFFFF",
    fontWeight: 700,
    fontSize: 15,
  },

  app: {
    minHeight: "100vh",
    background: "#F5F0E6",
    fontFamily: "Arial,sans-serif",
    color: "#394332",
  },

  contenedor: {
    maxWidth: 600,
    margin: "auto",
    padding: "22px 16px 60px",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #D8CEBD",
    paddingBottom: 16,
  },

  titulo: {
    margin: 0,
    fontSize: 28,
    letterSpacing: 2,
  },

  botonSalir: {
    border: "1px solid #B9AD98",
    borderRadius: 9,
    background: "transparent",
    padding: "8px 13px",
    color: "#706857",
  },

  h2: {
    margin: "25px 0 15px",
    fontSize: 26,
  },

  resumen: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 8,
    marginBottom: 16,
  },

  tarjetaResumen: {
    background: "#FFFFFF",
    borderRadius: 12,
    padding: "14px 5px",
    textAlign: "center",
    fontSize: 11,
  },

  numero: {
    display: "block",
    fontSize: 20,
    color: "#4E5B43",
    marginBottom: 4,
  },

  mensaje: {
    background: "#FFFFFF",
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontSize: 13,
  },

  formulario: {
    background: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },

  label: {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    margin: "12px 0 5px",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    borderRadius: 9,
    border: "1px solid #D5CCBC",
    background: "#FFFFFF",
    fontSize: 15,
  },

  dosColumnas: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 8,
  },

  tresColumnas: {
    display: "grid",
    gridTemplateColumns: "repeat(3,1fr)",
    gap: 7,
  },

  info: {
    background: "#F5F0E6",
    padding: 10,
    borderRadius: 8,
    fontSize: 12,
    lineHeight: 1.6,
    marginTop: 12,
  },

  botonGuardar: {
    width: "100%",
    marginTop: 15,
    padding: 15,
    border: 0,
    borderRadius: 10,
    background: "#A48650",
    color: "#FFFFFF",
    fontWeight: 700,
  },

  seccion: {
    margin: "28px 0 10px",
    fontSize: 18,
  },

  habitacion: {
    display: "flex",
    alignItems: "center",
    gap: 11,
    background: "#FFFFFF",
    borderRadius: 12,
    padding: 13,
    marginBottom: 9,
  },

  circulo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    background: "#E7E1D4",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    flexShrink: 0,
  },

  tipo: {
    display: "block",
    fontSize: 13,
    marginBottom: 4,
  },

  detalle: {
    display: "block",
    color: "#817866",
    fontSize: 11,
    marginTop: 3,
  },

  estado: {
    fontSize: 10,
    borderRadius: 20,
    padding: "6px 8px",
    background: "#EAF0E6",
    color: "#55704C",
    whiteSpace: "nowrap",
  },

  reserva: {
    display: "flex",
    justifyContent: "space-between",
    gap: 10,
    background: "#FFFFFF",
    borderRadius: 12,
    padding: 13,
    marginBottom: 8,
  },

  vacio: {
    background: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    textAlign: "center",
    color: "#817866",
    fontSize: 13,
  },
};
