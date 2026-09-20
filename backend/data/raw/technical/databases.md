---
skill: databases
category: backend
difficulty: beginner-to-advanced
content_type: technical_knowledge
interview_relevance: high
---

# Databases

## Relational Databases

PostgreSQL and MySQL are relational databases that support structured schemas, transactions, ACID properties, and complex joins.

## NoSQL Databases

MongoDB and DynamoDB are examples of NoSQL systems used for flexible schemas, high throughput, and horizontal scaling depending on the workload.

## Indexing

A B-tree index can improve read performance by avoiding full table scans.

### Index Trade-offs

Indexes:

- consume additional storage
- can slow INSERT/UPDATE/DELETE operations
- are not automatically useful for every column

Avoid unnecessary indexes on small tables, low-selectivity columns, rarely queried columns, or heavily written tables.

## Interview Areas

- ACID
- Transactions
- Isolation levels
- Indexes
- Joins
- Normalization
- Replication
- Partitioning
- Sharding
- SQL versus NoSQL

## Verified Official Learning Links

- PostgreSQL Official Documentation: https://www.postgresql.org/docs/current/
- MySQL 8.0 Reference Manual: https://dev.mysql.com/doc/refman/8.0/en/
- Use The Index, Luke (SQL Indexing Guide): https://use-the-index-luke.com/
- MongoDB University & Manual: https://www.mongodb.com/docs/manual/
