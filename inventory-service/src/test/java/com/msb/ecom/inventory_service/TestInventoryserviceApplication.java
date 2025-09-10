package com.msb.ecom.inventory_service;

import org.springframework.boot.SpringApplication;

public class TestInventoryserviceApplication {

	public static void main(String[] args) {
		SpringApplication.from(InventoryserviceApplication::main).with(TestcontainersConfiguration.class).run(args);
	}

}
