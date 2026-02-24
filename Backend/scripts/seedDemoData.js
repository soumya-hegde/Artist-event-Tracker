const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../app/model/userModel');
const Artist = require('../app/model/artistModel');
const Venue = require('../app/model/venueModel');
const Event = require('../app/model/eventModel');
const Booking = require('../app/model/bookingModel');

const VENUE_COUNT = 200;
const ARTIST_COUNT = 500;
const FAN_COUNT = 10000;
const EVENTS_PER_ARTIST = 3;

const citySeeds = [
  { city: 'Bangalore', state: 'Karnataka', country: 'India', lat: 12.9716, lng: 77.5946 },
  { city: 'Mumbai', state: 'Maharashtra', country: 'India', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi', country: 'India', lat: 28.6139, lng: 77.209 },
  { city: 'Hyderabad', state: 'Telangana', country: 'India', lat: 17.385, lng: 78.4867 },
  { city: 'Chennai', state: 'Tamil Nadu', country: 'India', lat: 13.0827, lng: 80.2707 },
  { city: 'Pune', state: 'Maharashtra', country: 'India', lat: 18.5204, lng: 73.8567 },
  { city: 'Kolkata', state: 'West Bengal', country: 'India', lat: 22.5726, lng: 88.3639 },
  { city: 'Ahmedabad', state: 'Gujarat', country: 'India', lat: 23.0225, lng: 72.5714 },
  { city: 'Jaipur', state: 'Rajasthan', country: 'India', lat: 26.9124, lng: 75.7873 },
  { city: 'Kochi', state: 'Kerala', country: 'India', lat: 9.9312, lng: 76.2673 },
];

const randomCoordinate = (base, variance = 0.25) => {
  const delta = faker.number.float({ min: -variance, max: variance, fractionDigits: 6 });
  return Number((base + delta).toFixed(6));
};

const randomTimeRange = () => {
  const startHour = faker.number.int({ min: 16, max: 21 });
  const durationHours = faker.number.int({ min: 2, max: 4 });
  const endHour = Math.min(startHour + durationHours, 23);
  return {
    startTime: `${startHour % 12 || 12}:00 ${startHour >= 12 ? 'PM' : 'AM'}`,
    endTime: `${endHour % 12 || 12}:00 ${endHour >= 12 ? 'PM' : 'AM'}`,
  };
};

const chunk = (arr, size) => {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required in .env');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  console.log('Clearing collections...');
  await Promise.all([
    Booking.deleteMany({}),
    Event.deleteMany({}),
    Artist.deleteMany({}),
    Venue.deleteMany({}),
    User.deleteMany({}),
  ]);

  const hashedPassword = await bcrypt.hash('Password@123', 10);

  console.log(`Creating ${VENUE_COUNT} venues...`);
  const venues = Array.from({ length: VENUE_COUNT }, (_, i) => {
    const base = faker.helpers.arrayElement(citySeeds);
    return {
      name: `${faker.company.name()} Arena ${i + 1}`,
      address: faker.location.streetAddress(),
      city: base.city,
      state: base.state,
      country: base.country,
      location: {
        type: 'Point',
        coordinates: [randomCoordinate(base.lng), randomCoordinate(base.lat)],
      },
    };
  });
  const venueDocs = await Venue.insertMany(venues, { ordered: false });

  console.log(`Creating ${ARTIST_COUNT} artist users...`);
  const artistUsers = Array.from({ length: ARTIST_COUNT }, (_, i) => ({
    name: faker.person.fullName(),
    email: `artist${i + 1}@seeded.com`,
    password: hashedPassword,
    role: 'artist',
  }));
  const artistUserDocs = await User.insertMany(artistUsers, { ordered: true });

  console.log(`Creating ${ARTIST_COUNT} artist profiles...`);
  const artistProfiles = artistUserDocs.map((user) => ({
    userId: user._id,
    stageName: faker.music.songName().slice(0, 80),
    bio: faker.lorem.sentences({ min: 1, max: 3 }).slice(0, 500),
    city: faker.helpers.arrayElement(citySeeds).city,
    socialLinks: {
      instagram: faker.internet.url(),
      youtube: faker.internet.url(),
    },
  }));
  const artistDocs = await Artist.insertMany(artistProfiles, { ordered: true });

  console.log(`Creating ${ARTIST_COUNT * EVENTS_PER_ARTIST} events...`);
  const events = [];
  artistDocs.forEach((artist, artistIndex) => {
    for (let i = 0; i < EVENTS_PER_ARTIST; i += 1) {
      const venue = faker.helpers.arrayElement(venueDocs);
      const eventDate = new Date();
      eventDate.setDate(eventDate.getDate() + artistIndex * EVENTS_PER_ARTIST + i + 1);
      const { startTime, endTime } = randomTimeRange();

      events.push({
        artistId: artist._id,
        venueId: venue._id,
        title: faker.music.songName().slice(0, 80),
        description: faker.lorem.sentences({ min: 1, max: 2 }),
        eventDate,
        startTime,
        endTime,
      });
    }
  });
  const eventDocs = await Event.insertMany(events, { ordered: false });

  console.log(`Creating ${FAN_COUNT} fan users...`);
  const fanUsers = Array.from({ length: FAN_COUNT }, (_, i) => ({
    name: faker.person.fullName(),
    email: `fan${i + 1}@seeded.com`,
    password: hashedPassword,
    role: 'fan',
  }));
  const fanUserDocs = await User.insertMany(fanUsers, { ordered: true });

  console.log(`Creating bookings for ${FAN_COUNT} fans (5-10 each)...`);
  const eventIds = eventDocs.map((event) => event._id);
  const bookingRows = [];

  fanUserDocs.forEach((fan) => {
    const count = faker.number.int({ min: 5, max: 10 });
    const chosen = new Set();
    while (chosen.size < count) {
      const idx = faker.number.int({ min: 0, max: eventIds.length - 1 });
      chosen.add(String(eventIds[idx]));
    }
    chosen.forEach((eventId) => {
      bookingRows.push({
        fanId: fan._id,
        eventId,
        bookedAt: faker.date.recent({ days: 30 }),
      });
    });
  });

  for (const part of chunk(bookingRows, 5000)) {
    // ordered:false skips rare duplicates safely and keeps bulk insert fast
    await Booking.insertMany(part, { ordered: false });
  }

  console.log('Seeding completed');
  console.log('Sample credentials:');
  console.log('Artist: artist1@seeded.com / Password@123');
  console.log('Fan: fan1@seeded.com / Password@123');
};

seed()
  .catch((error) => {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
