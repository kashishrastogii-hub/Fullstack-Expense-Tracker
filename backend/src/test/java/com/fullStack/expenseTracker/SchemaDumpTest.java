package com.fullStack.expenseTracker;

import com.fullStack.expenseTracker.models.Budget;
import com.fullStack.expenseTracker.models.Category;
import com.fullStack.expenseTracker.models.Role;
import com.fullStack.expenseTracker.models.SavedTransaction;
import com.fullStack.expenseTracker.models.Transaction;
import com.fullStack.expenseTracker.models.TransactionType;
import com.fullStack.expenseTracker.models.User;
import org.hibernate.boot.Metadata;
import org.hibernate.boot.MetadataSources;
import org.hibernate.boot.registry.StandardServiceRegistry;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.tool.schema.internal.SchemaCreatorImpl;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Development helper: writes the MySQL DDL Hibernate expects for the current entities to
 * target/schema-mysql.sql, so Flyway's initial migration stays in sync with the model.
 * Not part of the application runtime.
 */
class SchemaDumpTest {

    @Test
    void dumpSchema() throws Exception {
        StandardServiceRegistry registry = new StandardServiceRegistryBuilder()
                .applySetting("hibernate.dialect", "org.hibernate.dialect.MySQLDialect")
                .applySetting("hibernate.boot.allow_jdbc_metadata_access", "false")
                .applySetting("hibernate.format_sql", "true")
                // Spring Boot's defaults, so the generated names match the running application
                .applySetting("hibernate.implicit_naming_strategy",
                        "org.springframework.boot.orm.jpa.hibernate.SpringImplicitNamingStrategy")
                .applySetting("hibernate.physical_naming_strategy",
                        "org.hibernate.boot.model.naming.CamelCaseToUnderscoresNamingStrategy")
                .build();

        try {
            MetadataSources sources = new MetadataSources(registry);
            sources.addAnnotatedClass(User.class);
            sources.addAnnotatedClass(Role.class);
            sources.addAnnotatedClass(TransactionType.class);
            sources.addAnnotatedClass(Category.class);
            sources.addAnnotatedClass(Transaction.class);
            sources.addAnnotatedClass(Budget.class);
            sources.addAnnotatedClass(SavedTransaction.class);
            Metadata metadata = sources.buildMetadata();

            SchemaCreatorImpl creator = new SchemaCreatorImpl(registry);
            List<String> commands = creator.generateCreationCommands(metadata, false);

            assertFalse(commands.isEmpty(), "No DDL was generated");

            Path output = Path.of("target", "schema-mysql.sql");
            Files.writeString(output, String.join(";\n", commands) + ";\n");
            System.out.println("Wrote " + commands.size() + " statements to " + output.toAbsolutePath());
        } finally {
            StandardServiceRegistryBuilder.destroy(registry);
        }
    }
}
