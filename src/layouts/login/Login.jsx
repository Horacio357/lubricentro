import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase/firebaseConfig"; // Importa la configuración de Firebase
import styles from "./Login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      handleFirebaseError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseError = (err) => {
    switch (err.code) {
      case "auth/invalid-email":
        setError("Correo electrónico no válido.");
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        setError("Email o contraseña incorrectos.");
        break;
      case "auth/too-many-requests":
        setError("Demasiados intentos fallidos. Intenta más tarde.");
        break;
      default:
        setError("Ocurrió un error. Intenta nuevamente.");
    }
  };

  return (
    <div className={styles.container}>
       <img src="/logo_negro.webp" className={styles.logo}/>
      <h2 className={styles.title}>Iniciar Sesión</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleLogin} className={styles.form}>
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={styles.input}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={styles.input}
          required
        />
        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Cargando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}