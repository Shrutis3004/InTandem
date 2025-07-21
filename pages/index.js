import { useEffect, useRef, useState } from "react";

export default function Home() {
  const mappoint = useRef(null);
  const remarkpoint = useRef({});
  const [loc, finalloc] = useState([]);
  const [L, setL] = useState(null);
  const [coll, finalcol] = useState(null);
  const [inputt, finalinput] = useState("");
  const [addres, finaladdres] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    Promise.all([import("leaflet"), import("leaflet/dist/leaflet.css")]).then(
      ([leaflet]) => {
        setL(leaflet);

        delete leaflet.Icon.Default.prototype._getIconUrl;
        leaflet.Icon.Default.mergeOptions({
          iconRetinaUrl: "/images/marker-icon-2x.png",
          iconUrl: "/images/marker-icon.png",
          shadowUrl: "/images/marker-shadow.png",
        });

        if (mappoint.current) return;

        const initMap = (lat, lng, showInitialMarker = false) => {
          const map = leaflet.map("map-container").setView([lat, lng], 13);
          mappoint.current = map;

          leaflet
            .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            })
            .addTo(map);

          if (showInitialMarker) {
            const marker = leaflet
              .marker([lat, lng])
              .addTo(map)
              .bindPopup("You are here")
              .openPopup();

            const id = Date.now();
            remarkpoint.current[id] = marker;

            fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            )
              .then((res) => res.json())
              .then((data) => {
                const address = data.display_name;
                finalloc((prev) => [
                  ...prev,
                  { id, address, remark: "You are here" },
                ]);
              });
          }

          fetch("http://localhost:5000/api/pins")
            .then((res) => res.json())
            .then(async (data) => {
              const pinsWithAddresses = await Promise.all(
                data.map(async (pin) => {
                  try {
                    const res = await fetch(
                      `https://nominatim.openstreetmap.org/reverse?lat=${pin.latitude}&lon=${pin.longitude}&format=json`
                    );
                    const json = await res.json();
                    return {
                      id: Date.now() + Math.random(),
                      lat: pin.latitude,
                      lng: pin.longitude,
                      address: pin.place || json.display_name,
                      remark: pin.memory || "Pinned Memory",
                    };
                  } catch {
                    return null;
                  }
                })
              );

              pinsWithAddresses.filter(Boolean).forEach((pin) => {
                const marker = leaflet
                  .marker([pin.lat, pin.lng])
                  .addTo(map)
                  .bindPopup(`<b>${pin.address}</b><br/>${pin.remark}`);

                remarkpoint.current[pin.id] = marker;
                finalloc((prev) => [...prev, pin]);
              });
            });

          map.on("click", async (e) => {
            const { lat, lng } = e.latlng;
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
            );
            const data = await res.json();

            const address = data.display_name;
            finalcol({ lat, lng, address });
          });
        };

        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords;
              initMap(latitude, longitude, true);
            },
            () => initMap(20.5937, 78.9629)
          );
        } else {
          initMap(20.5937, 78.9629);
        }
      }
    );
  }, []);

  const addition = async () => {
    const id = Date.now();
    const { lat, lng, address } = coll;
    const remark = inputt || "No remark";

    const marker = L.marker([lat, lng])
      .addTo(mappoint.current)
      .bindPopup(`<b>${address}</b><br/>${remark}`)
      .openPopup();

    remarkpoint.current[id] = marker;

    finalloc((prev) => [...prev, { id, address, remark }]);

    try {
      await fetch("http://localhost:5000/api/pins/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: lat,
          longitude: lng,
          memory: remark,
          place: address,
        }),
      });
    } catch (error) {
      console.error("Failed to save memory:", error);
    }

    finalcol(null);
    finalinput("");
  };

  const blurr = () => {
    finalcol(null);
    finalinput("");
  };

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .styling-remark {
          font-family: 'Great Vibes', cursive;
          font-size: 2rem;
          color: #222;
          transition: all 0.3s ease;
        }
        .styling-addres {
          max-height: 200px;
          overflow: hidden;
          transition: max-height 0.5s ease-in-out;
        }
        .styling-addres .show {
          max-height: 1000px;
        }
        .fadess {
          animation: fadeIn 0.6s ease-out;
        }
        @keyframes fadess {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .addbutton:hover {
          background-color: #0056b3;
          transform: scale(1.05);
        }
      `}</style>

      <div
        style={{
          display: "flex",
          height: "100vh",
          width: "100vw",
          overflow: "hidden",
          margin: 0,
          padding: 0,
          fontFamily: "Arial, sans-serif",
          filter: coll ? "blur(5px)" : "none",
          transition: "filter 0.3s ease",
        }}
      >
        <div
          style={{
            width: "300px",
            background: "linear-gradient(to bottom right, #fceabb, #f8b500)",
            padding: "1rem",
            overflowY: "auto",
            boxSizing: "border-box",
            borderRight: "1px solid #ccc",
          }}
        >
          <h2 style={{ marginTop: 0, fontFamily: "cursive" }}>
            Your Marked Memories
          </h2>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {loc.map((addr) => (
              <li
                key={addr.id}
                className="fadess"
                style={{
                  marginBottom: "1rem",
                  background: "#fff",
                  padding: "12px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                }}
              >
                <div className="styling-remark">
                  <strong>{addr.remark}</strong>
                </div>
                <button
                  className="addbutton"
                  style={{
                    marginTop: "6px",
                    fontSize: "0.9rem",
                    padding: "7px 15px",
                    cursor: "pointer",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    marginBottom: "5px",
                  }}
                  onClick={() =>
                    finaladdres(addres === addr.id ? null : addr.id)
                  }
                >
                  {addres === addr.id ? "Skip Address" : "Address Details"}
                </button>
                <div
                  className={`styling-addres  ${
                    addres === addr.id ? "show" : ""
                  }`}
                  style={{
                    fontSize: "1rem",
                    color: "#333",
                    transition: "max-height 0.3s ease",
                  }}
                >
                  {addres === addr.id && <em>{addr.address}</em>}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div id="map-container" style={{ flexGrow: 1, height: "100%" }}></div>
      </div>

      {coll && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "#fff",
              padding: "20px",
              borderRadius: "12px",
              width: "300px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              textAlign: "center",
              animation: "fadeIn 0.4s ease-out",
            }}
          >
            <h3 style={{ marginBottom: "1rem", fontFamily: "cursive" }}>
              What's special about this place?
            </h3>
            <input
              type="text"
              placeholder="Type your thoughts."
              value={inputt}
              onChange={(e) => finalinput(e.target.value)}
              style={{
                width: "100%",
                padding: "5px",
                marginBottom: "1rem",
                borderRadius: "6px",
                border: "1px solid #ccc",
                fontFamily: "cursive",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                onClick={addition}
                style={{
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#007bff",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: "bold",
                }}
              >
                Save Memory!!
              </button>
              <button
                onClick={blurr}
                style={{
                  padding: "10px 15px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#ccc",
                  color: "#333",
                  cursor: "pointer",
                }}
              >
                Drop it.
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
