package nic.mn.pis;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PisApplication {

	public static void main(String[] args) {
		SpringApplication.run(PisApplication.class, args);
	}
}
