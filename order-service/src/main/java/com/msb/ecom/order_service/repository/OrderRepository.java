package com.msb.ecom.order_service.repository;

import com.msb.ecom.order_service.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrderRepository extends JpaRepository<Order, Long> {
}
