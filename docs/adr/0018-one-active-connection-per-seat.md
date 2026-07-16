# Allow one Active Seat Connection per seat

Each Seat Token may have exactly one Active Seat Connection, and a newly authenticated connection atomically replaces the previous connection, which closes with `seat_replaced`. Rejecting reconnect while a stale socket exists and allowing concurrent sockets were rejected because refresh and recovery must work without permitting two tabs to race commands for one seat; replacement itself does not start the disconnect grace period.
