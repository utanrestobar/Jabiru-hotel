"use client";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background:
          "linear-gradient(180deg, #F5F0E6 0%, #E8DFCF 100%)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "430px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            letterSpacing: "4px",
            color: "#85704D",
            marginBottom: "12px",
          }}
        >
          HOTEL
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "48px",
            fontWeight: "600",
            letterSpacing: "3px",
            color: "#394332",
          }}
        >
          JABIRÚ
        </h1>

        <p
          style={{
            marginTop: "12px",
            marginBottom: "40px",
            fontSize: "16px",
            color: "#706857",
          }}
        >
          Gestión del hotel
        </p>

        <button
          type="button"
          style={{
            width: "100%",
            padding: "17px",
            border: "none",
            borderRadius: "12px",
            backgroundColor: "#4E5B43",
            color: "#FFFFFF",
            fontSize: "17px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          INGRESAR
        </button>

        <p
          style={{
            marginTop: "28px",
            fontSize: "12px",
            color: "#948B7A",
          }}
        >
          Sistema de administración
        </p>
      </section>
    </main>
  );
}
