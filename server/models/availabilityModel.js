const { query } = require('../database/db');

// Set or update availability slot
const setAvailability = async (expertId, availabilityData) => {
    const { dayOfWeek, startTime, endTime, timezone } = availabilityData;

    // Check if slot overlaps with existing for the same day
    const checkText = `
        SELECT * FROM expert_availability 
        WHERE expert_id = $1 
        AND day_of_week = $2
        AND is_active = true
        AND (
            (start_time <= $3 AND end_time > $3) OR
            (start_time < $4 AND end_time >= $4) OR
            (start_time >= $3 AND end_time <= $4)
        )
    `;
    const conflict = await query(checkText, [expertId, dayOfWeek, startTime, endTime]);

    if (conflict.rows.length > 0) {
        throw new Error('Time slot overlaps with existing availability');
    }

    const text = `
        INSERT INTO expert_availability (
            expert_id, day_of_week, start_time, end_time, timezone
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const values = [expertId, dayOfWeek, startTime, endTime, timezone];

    const result = await query(text, values);
    return result.rows[0];
};

// Get all availability for an expert
const getExpertAvailability = async (expertId) => {
    const text = `
        SELECT * FROM expert_availability
        WHERE expert_id = $1 AND is_active = true
        ORDER BY day_of_week ASC, start_time ASC
    `;
    const result = await query(text, [expertId]);
    return result.rows;
};

// Delete availability slot
const deleteAvailability = async (id, expertId) => {
    const text = `
        DELETE FROM expert_availability
        WHERE id = $1 AND expert_id = $2
        RETURNING *
    `;
    const result = await query(text, [id, expertId]);
    return result.rows[0];
};

// Get available slots for a specific date (helper for scheduling)
// This is a simplified version; real implementation would check against existing bookings
const getAvailableSlotsForDate = async (expertId, date, durationMinutes = 60) => {
    const dayOfWeek = new Date(date).getDay();

    // Get general availability for this day
    const availability = await query(`
        SELECT * FROM expert_availability
        WHERE expert_id = $1 
        AND day_of_week = $2 
        AND is_active = true
    `, [expertId, dayOfWeek]);

    // Get existing bookings/interviews for this date
    const bookings = await query(`
        SELECT scheduled_at, duration_minutes 
        FROM project_interviews
        WHERE expert_id = $1 
        AND DATE(scheduled_at) = DATE($2)
        AND status != 'cancelled'
    `, [expertId, date]);

    // Logic to calculate free slots would go here
    // For now returning raw availability windows
    return {
        windows: availability.rows,
        bookings: bookings.rows
    };
};

module.exports = {
    setAvailability,
    getExpertAvailability,
    deleteAvailability,
    getAvailableSlotsForDate
};
