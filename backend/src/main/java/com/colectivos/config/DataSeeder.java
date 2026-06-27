package com.colectivos.config;

import com.colectivos.model.Route;
import com.colectivos.model.Stop;
import com.colectivos.presenter.RouteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedRoutes(RouteRepository routeRepository) {
        return args -> {
            routeRepository.save(new Route(
                    "linea-60",
                    "Línea 60 — Palermo → Constitución",
                    List.of(
                            new Stop("Palermo",        0.0, 0.0),
                            new Stop("Santa Fe",       2.0, 5.0),
                            new Stop("Corrientes",     3.0, 8.0),
                            new Stop("9 de Julio",     3.0, 8.0),
                            new Stop("Constitución",   4.0, 10.0)
                    )
            ));

            routeRepository.save(new Route(
                    "linea-12",
                    "Línea 12 — Retiro → La Boca",
                    List.of(
                            new Stop("Retiro",    0.0, 0.0),
                            new Stop("Lavalle",   3.0, 6.0),
                            new Stop("San Telmo", 4.0, 11.0),
                            new Stop("La Boca",   3.0, 10.0)
                    )
            ));

            routeRepository.save(new Route(
                    "linea-24",
                    "Línea 24 — Congreso → Floresta",
                    List.of(
                            new Stop("Congreso",   0.0, 0.0),
                            new Stop("Once",       2.5, 6.0),
                            new Stop("Caballito",  4.0, 10.0),
                            new Stop("Villa Crespo", 3.5, 9.0),
                            new Stop("Floresta",   5.0, 12.0)
                    )
            ));
        };
    }
}
