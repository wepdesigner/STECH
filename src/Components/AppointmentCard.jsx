function AppointmentCard({ appt }) {
  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <p><strong>Patient:</strong> {appt.patient}</p>
      <p><strong>Date:</strong> {appt.date}</p>
      <p><strong>Status:</strong> {appt.status}</p>

      <div className="mt-3 space-x-2">
        <button className="bg-green-500 text-white px-3 py-1 rounded">
          Accept
        </button>

        <button className="bg-red-500 text-white px-3 py-1 rounded">
          Reject
        </button>
      </div>
    </div>
  );
}

export default AppointmentCard;