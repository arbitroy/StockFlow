package com.stockflow.api.model;

import com.stockflow.api.enums.LocationType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "locations")
@Getter @Setter
public class Location extends BaseEntity {
    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private LocationType type;  // WAREHOUSE or STORE
}