export const machines = [
  {
    id: 1,
    name: "Compressor Unit A",
    image: "/images/machine1.jpg",
    energy: {
      electricity: 320,
      water: 110,
      gas: 80,
      graph: [
        { time: '08:00', electricity: 30, water: 12, gas: 7 },
        { time: '10:00', electricity: 50, water: 20, gas: 10 },
        { time: '12:00', electricity: 40, water: 15, gas: 6 },
        { time: '14:00', electricity: 60, water: 22, gas: 9 },
      ],
    },
  },
  {
    id: 2,
    name: "Welding Arm B",
    image: "/images/machine2.jpg",
    energy: {
      electricity: 410,
      water: 90,
      gas: 60,
      graph: [
        { time: '08:00', electricity: 40, water: 10, gas: 6 },
        { time: '10:00', electricity: 70, water: 18, gas: 12 },
        { time: '12:00', electricity: 60, water: 14, gas: 8 },
        { time: '14:00', electricity: 80, water: 25, gas: 10 },
      ],
    },
  },
];
