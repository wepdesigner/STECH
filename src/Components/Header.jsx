function Header() {
  return (
    <div className="bg-white shadow p-4 flex justify-between">
      <h1 className="text-lg font-semibold">STECH Dental</h1>

      <div>
        <span className="mr-4">Dr. User</span>
        <button className="bg-red-500 text-white px-3 py-1 rounded">
          Logout
        </button>
      </div>
    </div>
  );
}

export default Header;