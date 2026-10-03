import type { events } from '../en/events';

export const eventsHi: Record<keyof typeof events, string> = {
  'events.title': 'कार्यक्रम',
  'events.linkHint': 'स्कूल के आने वाले कार्यक्रम',
  'events.monthHeader': '{month} {year}',
  'events.upcoming': 'आने वाले',
  'events.none': 'कोई आने वाला कार्यक्रम नहीं',
  'events.noneMessage': 'स्कूल जो कार्यक्रम तय करेगा, वे यहाँ दिखेंगे।',
  'events.past_one': '{count} बीता कार्यक्रम',
  'events.past_other': '{count} बीते कार्यक्रम',
  'events.showPast': 'बीते कार्यक्रम दिखाएँ',
  'events.hidePast': 'बीते कार्यक्रम छिपाएँ',
  'events.cardLabel': '{title}, {when}{time}{place}',
  'events.timeRange': '{start} से {end}',
  'events.timeFrom': '{start} से',
  'events.timeUntil': '{end} तक',
  'events.allDay': 'पूरे दिन',
};
