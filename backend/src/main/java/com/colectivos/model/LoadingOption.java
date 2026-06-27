package com.colectivos.model;

public enum LoadingOption {
    /** Aceleración (m/s²) + velocidad esperada de crucero (km/h) */
    ACCEL_VELOCITY,
    /** Aceleración (m/s²) + tiempo de aplicación de aceleración (segundos simulados) */
    ACCEL_TIME,
    /** Distancia total (km) + velocidad promedio (km/h) */
    DIST_VELOCITY
}
