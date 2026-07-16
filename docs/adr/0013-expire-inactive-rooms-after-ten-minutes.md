# Expire inactive rooms after ten minutes

A Private Room is deleted if no invited Guest Player joins within ten minutes of creation, and an active Online Match becomes an Abandoned Match after ten minutes without an accepted Player Command. The separate 120-second reconnect window governs disconnected seats, while completed and abandoned terminal data still follows the one-hour deletion policy; all deadlines are driven by Durable Object alarms rather than client timers.
