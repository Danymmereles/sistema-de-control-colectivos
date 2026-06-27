package com.colectivos.model;

public enum ControlSignal {
    /** Dentro de la banda de error aceptable. Sin acción necesaria. */
    OK,
    /** Fuera de la banda aceptable pero dentro del máximo recuperable. El actuador actúa. */
    DELAYED,
    /** Fuera del máximo recuperable. El viaje no puede continuar. */
    CRITICAL
}
