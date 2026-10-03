/** Google Maps night style in the app's warm near-black. Apple Maps ignores it and follows `userInterfaceStyle`. */
export const DARK_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1c1815' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#b8aea5' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#14110f' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#332d29' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#8e847b' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2419' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2d2723' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#201b18' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3d352f' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2a2420' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0b0a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#6f665f' }] },
];
