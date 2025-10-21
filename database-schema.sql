-- TripGo Database Schema - Complete Real-time System
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- AUTHENTICATION & USER MANAGEMENT
-- =============================================

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_code TEXT,
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved passengers table
CREATE TABLE IF NOT EXISTS public.saved_passengers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Mr',
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    passport_number TEXT NOT NULL,
    nationality TEXT NOT NULL DEFAULT 'Indonesia',
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TRANSPORTATION DATA
-- =============================================

-- Airlines table
CREATE TABLE IF NOT EXISTS public.airlines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    logo_url TEXT,
    country TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trains table
CREATE TABLE IF NOT EXISTS public.trains (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    operator TEXT NOT NULL,
    type TEXT NOT NULL, -- 'ekonomi', 'bisnis', 'eksekutif'
    logo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Routes table
CREATE TABLE IF NOT EXISTS public.routes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    origin_code TEXT NOT NULL,
    origin_name TEXT NOT NULL,
    destination_code TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    distance_km INTEGER,
    estimated_duration_minutes INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flights table
CREATE TABLE IF NOT EXISTS public.flights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flight_number TEXT NOT NULL,
    airline_id UUID REFERENCES public.airlines(id),
    route_id UUID REFERENCES public.routes(id),
    aircraft_type TEXT,
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_departure TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'in_flight', 'landed', 'delayed', 'cancelled')),
    gate TEXT,
    terminal TEXT,
    baggage_claim TEXT,
    delay_reason TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    available_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Train schedules table
CREATE TABLE IF NOT EXISTS public.train_schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    train_id UUID REFERENCES public.trains(id),
    route_id UUID REFERENCES public.routes(id),
    scheduled_departure TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_arrival TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_departure TIMESTAMP WITH TIME ZONE,
    actual_arrival TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'boarding', 'departed', 'in_transit', 'arrived', 'delayed', 'cancelled')),
    platform TEXT,
    delay_reason TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    available_seats INTEGER NOT NULL,
    total_seats INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- SEAT MANAGEMENT
-- =============================================

-- Seat availability table
CREATE TABLE IF NOT EXISTS public.seat_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    flight_id UUID REFERENCES public.flights(id) ON DELETE CASCADE,
    train_schedule_id UUID REFERENCES public.train_schedules(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    seat_type TEXT NOT NULL, -- 'economy', 'business', 'first'
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'blocked', 'selected')),
    user_id UUID REFERENCES public.users(id),
    blocked_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- BOOKING SYSTEM
-- =============================================

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_reference TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id),
    flight_id UUID REFERENCES public.flights(id),
    train_schedule_id UUID REFERENCES public.train_schedules(id),
    booking_type TEXT NOT NULL CHECK (booking_type IN ('flight', 'train')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'IDR',
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    payment_reference TEXT,
    booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    travel_date TIMESTAMP WITH TIME ZONE NOT NULL,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking passengers table
CREATE TABLE IF NOT EXISTS public.booking_passengers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    passport_number TEXT NOT NULL,
    nationality TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    seat_number TEXT,
    seat_type TEXT,
    seat_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- PAYMENT SYSTEM
-- =============================================

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    booking_id UUID REFERENCES public.bookings(id),
    payment_method TEXT NOT NULL,
    payment_gateway TEXT NOT NULL, -- 'midtrans', 'xendit', 'dana', etc.
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'IDR',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled', 'refunded')),
    gateway_transaction_id TEXT,
    gateway_response JSONB,
    failure_reason TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATION SYSTEM
-- =============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('booking', 'flight', 'payment', 'reminder', 'system')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- REVIEWS & RATINGS
-- =============================================

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    booking_id UUID REFERENCES public.bookings(id),
    flight_id UUID REFERENCES public.flights(id),
    train_schedule_id UUID REFERENCES public.train_schedules(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT,
    comment TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ADMIN SYSTEM
-- =============================================

-- Admin roles table
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.admin_roles(id),
    department TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    admin_user_id UUID REFERENCES public.admin_users(id),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON public.users(verification_code);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);

-- Saved passengers indexes
CREATE INDEX IF NOT EXISTS idx_saved_passengers_user_id ON public.saved_passengers(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_passengers_is_default ON public.saved_passengers(is_default);

-- Flights indexes
CREATE INDEX IF NOT EXISTS idx_flights_route_id ON public.flights(route_id);
CREATE INDEX IF NOT EXISTS idx_flights_scheduled_departure ON public.flights(scheduled_departure);
CREATE INDEX IF NOT EXISTS idx_flights_status ON public.flights(status);
CREATE INDEX IF NOT EXISTS idx_flights_is_active ON public.flights(is_active);

-- Train schedules indexes
CREATE INDEX IF NOT EXISTS idx_train_schedules_route_id ON public.train_schedules(route_id);
CREATE INDEX IF NOT EXISTS idx_train_schedules_scheduled_departure ON public.train_schedules(scheduled_departure);
CREATE INDEX IF NOT EXISTS idx_train_schedules_status ON public.train_schedules(status);

-- Seat availability indexes
CREATE INDEX IF NOT EXISTS idx_seat_availability_flight_id ON public.seat_availability(flight_id);
CREATE INDEX IF NOT EXISTS idx_seat_availability_train_schedule_id ON public.seat_availability(train_schedule_id);
CREATE INDEX IF NOT EXISTS idx_seat_availability_status ON public.seat_availability(status);
CREATE INDEX IF NOT EXISTS idx_seat_availability_user_id ON public.seat_availability(user_id);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_flight_id ON public.bookings(flight_id);
CREATE INDEX IF NOT EXISTS idx_bookings_train_schedule_id ON public.bookings(train_schedule_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_reference ON public.bookings(booking_reference);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_gateway_transaction_id ON public.payments(gateway_transaction_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_flight_id ON public.reviews(flight_id);
CREATE INDEX IF NOT EXISTS idx_reviews_train_schedule_id ON public.reviews(train_schedule_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON public.reviews(rating);

-- Activity logs indexes
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_admin_user_id ON public.activity_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_resource_type ON public.activity_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Saved passengers policies
CREATE POLICY "Users can view own saved passengers" ON public.saved_passengers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved passengers" ON public.saved_passengers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved passengers" ON public.saved_passengers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved passengers" ON public.saved_passengers
    FOR DELETE USING (auth.uid() = user_id);

-- Bookings policies
CREATE POLICY "Users can view own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

-- Booking passengers policies
CREATE POLICY "Users can view own booking passengers" ON public.booking_passengers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = booking_passengers.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own booking passengers" ON public.booking_passengers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = booking_passengers.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

-- Payments policies
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings 
            WHERE bookings.id = payments.booking_id 
            AND bookings.user_id = auth.uid()
        )
    );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Users can view public reviews" ON public.reviews
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own reviews" ON public.reviews
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reviews" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON public.reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Public read access for transportation data
CREATE POLICY "Public can view airlines" ON public.airlines
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view trains" ON public.trains
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view routes" ON public.routes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view flights" ON public.flights
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view train schedules" ON public.train_schedules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view seat availability" ON public.seat_availability
    FOR SELECT USING (true);

-- =============================================
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name, phone, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'phone',
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth.users is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION public.generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN 'TRP' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to update seat availability
CREATE OR REPLACE FUNCTION public.update_seat_availability()
RETURNS TRIGGER AS $$
BEGIN
    -- Update seat status when booking is confirmed
    IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
        UPDATE public.seat_availability
        SET status = 'occupied', user_id = NEW.user_id
        WHERE flight_id = NEW.flight_id 
        AND seat_number IN (
            SELECT seat_number FROM public.booking_passengers 
            WHERE booking_id = NEW.id
        );
    END IF;
    
    -- Release seats when booking is cancelled
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        UPDATE public.seat_availability
        SET status = 'available', user_id = NULL
        WHERE flight_id = NEW.flight_id 
        AND seat_number IN (
            SELECT seat_number FROM public.booking_passengers 
            WHERE booking_id = NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update seat availability on booking status change
DROP TRIGGER IF EXISTS on_booking_status_change ON public.bookings;
CREATE TRIGGER on_booking_status_change
    AFTER UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.update_seat_availability();

-- Function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT NULL,
    p_priority TEXT DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, data, priority)
    VALUES (p_user_id, p_type, p_title, p_message, p_data, p_priority)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id UUID,
    p_action TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.activity_logs (user_id, action, resource_type, resource_id, old_values, new_values)
    VALUES (p_user_id, p_action, p_resource_type, p_resource_id, p_old_values, p_new_values)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.saved_passengers TO anon, authenticated;
GRANT ALL ON public.bookings TO anon, authenticated;
GRANT ALL ON public.booking_passengers TO anon, authenticated;
GRANT ALL ON public.payments TO anon, authenticated;
GRANT ALL ON public.notifications TO anon, authenticated;
GRANT ALL ON public.reviews TO anon, authenticated;
GRANT ALL ON public.airlines TO anon, authenticated;
GRANT ALL ON public.trains TO anon, authenticated;
GRANT ALL ON public.routes TO anon, authenticated;
GRANT ALL ON public.flights TO anon, authenticated;
GRANT ALL ON public.train_schedules TO anon, authenticated;
GRANT ALL ON public.seat_availability TO anon, authenticated;

-- Grant function permissions
GRANT EXECUTE ON FUNCTION public.create_notification TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_booking_reference TO anon, authenticated;

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample airlines
INSERT INTO public.airlines (code, name, country) VALUES
('GA', 'Garuda Indonesia', 'Indonesia'),
('JT', 'Lion Air', 'Indonesia'),
('QG', 'Citilink', 'Indonesia'),
('ID', 'Batik Air', 'Indonesia'),
('AK', 'AirAsia', 'Malaysia')
ON CONFLICT (code) DO NOTHING;

-- Insert sample trains
INSERT INTO public.trains (name, operator, type) VALUES
('Argo Bromo', 'PT Kereta Api Indonesia', 'eksekutif'),
('Taksaka', 'PT Kereta Api Indonesia', 'eksekutif'),
('Gajayana', 'PT Kereta Api Indonesia', 'eksekutif'),
('Bima', 'PT Kereta Api Indonesia', 'eksekutif'),
('Sembrani', 'PT Kereta Api Indonesia', 'eksekutif')
ON CONFLICT DO NOTHING;

-- Insert sample routes
INSERT INTO public.routes (origin_code, origin_name, destination_code, destination_name, distance_km, estimated_duration_minutes) VALUES
('CGK', 'Jakarta', 'DPS', 'Denpasar', 1000, 90),
('CGK', 'Jakarta', 'JOG', 'Yogyakarta', 500, 60),
('CGK', 'Jakarta', 'SUB', 'Surabaya', 700, 75),
('DPS', 'Denpasar', 'CGK', 'Jakarta', 1000, 90),
('JOG', 'Yogyakarta', 'CGK', 'Jakarta', 500, 60)
ON CONFLICT DO NOTHING;

-- Insert sample admin roles
INSERT INTO public.admin_roles (name, description, permissions) VALUES
('super_admin', 'Super Administrator', '{"all": true}'),
('admin', 'Administrator', '{"users": true, "bookings": true, "flights": true, "trains": true}'),
('finance', 'Finance Admin', '{"payments": true, "bookings": true, "reports": true}'),
('operations', 'Operations Admin', '{"flights": true, "trains": true, "routes": true}'),
('customer_service', 'Customer Service', '{"bookings": true, "users": true, "notifications": true}')
ON CONFLICT (name) DO NOTHING;
