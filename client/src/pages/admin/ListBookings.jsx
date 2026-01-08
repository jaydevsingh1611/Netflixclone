import React, { useEffect, useState } from "react";
import { Loading } from "../../components/Loading";
import { Title } from "../../components/admin/Title";
import { dateFormat } from "../../lib/dateFormat";
import { useAppContext } from "../../context/Appcontext";

export const ListBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY;
  const { axios, getToken, user } = useAppContext();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const getAllBookings = async () => {
    try {
      const { data } = await axios.get("/api/admin/all-bookings", {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data?.bookings) {
        setBookings(data.bookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getAllBookings();
    }
  }, [user]);

  if (isLoading) return <Loading />;

  return (
    <>
      <Title text1="List" text2="Bookings" />

      <div className="max-w-4xl mt-6 overflow-x-auto">
        <table className="w-full border-collapse rounded-md overflow-hidden text-nowrap">
          <thead>
            <tr className="bg-primary/20 text-left text-white">
              <th className="p-2 font-medium pl-5">User Name</th>
              <th className="p-2 font-medium">Movie Name</th>
              <th className="p-2 font-medium">Show Time</th>
              <th className="p-2 font-medium">Seats</th>
              <th className="p-2 font-medium">Amount</th>
            </tr>
          </thead>

          <tbody className="text-sm font-light">
            {bookings.length === 0 && (
              <tr>
                <td colSpan="5" className="p-4 text-center text-gray-400">
                  No bookings found
                </td>
              </tr>
            )}

            {bookings.map((item, index) => (
              <tr
                key={index}
                className="border-b border-primary/20 bg-primary/5 even:bg-primary/10"
              >
                <td className="p-2 min-w-45 pl-5">
                  {item.user?.name || "Deleted User"}
                </td>

                <td className="p-2">
                  {item.show?.movie?.title || "N/A"}
                </td>

                <td className="p-2">
                  {item.show?.showDateTime
                    ? dateFormat(item.show.showDateTime)
                    : "N/A"}
                </td>

                <td className="p-2">
                  {item.bookedSeats
                    ? Object.values(item.bookedSeats)
                        .flat()
                        .join(", ")
                    : "-"}
                </td>

                <td className="p-2">
                  {currency}{item.amount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};
