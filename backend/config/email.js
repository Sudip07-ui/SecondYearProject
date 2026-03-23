const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER) {
    console.log('📧  Email skipped (no EMAIL_USER configured)');
    return;
  }
  try {
    await transporter.sendMail({
      from: `"Rento 🛵" <${process.env.EMAIL_USER}>`,
      to, subject, html,
    });
    console.log(`📧  Email sent to ${to}`);
  } catch (err) {
    console.error('📧  Email send failed:', err.message);
  }
};

const bookingConfirmationEmail = (user, booking, vehicle) => ({
  to: user.email,
  subject: `Booking Confirmed – Rento #${booking.id}`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#E63946;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:28px">🛵 Rento</h1>
        <p style="color:#ffd;margin:4px 0 0">Simple Wheels Rental Platform</p>
      </div>
      <div style="padding:32px">
        <h2 style="color:#333">Booking Confirmed! 🎉</h2>
        <p>Hi <strong>${user.first_name}</strong>, your booking is confirmed.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold">Vehicle</td><td style="padding:10px">${vehicle.brand} ${vehicle.model_name}</td></tr>
          <tr><td style="padding:10px;font-weight:bold">Booking ID</td><td style="padding:10px">#${booking.id}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold">Start Date</td><td style="padding:10px">${booking.start_date}</td></tr>
          <tr><td style="padding:10px;font-weight:bold">End Date</td><td style="padding:10px">${booking.end_date}</td></tr>
          <tr style="background:#f5f5f5"><td style="padding:10px;font-weight:bold">Total Days</td><td style="padding:10px">${booking.total_days}</td></tr>
          <tr><td style="padding:10px;font-weight:bold">Total Cost</td><td style="padding:10px;color:#E63946;font-weight:bold">NPR ${booking.total_price}</td></tr>
        </table>
        <p style="color:#666;font-size:14px">Thank you for choosing Rento. Ride safe!</p>
      </div>
    </div>`,
});

const verificationStatusEmail = (user, status, reason) => ({
  to: user.email,
  subject: `Identity Verification ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'} – Rento`,
  html: `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e0e0e0;border-radius:8px;overflow:hidden">
      <div style="background:#E63946;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0">🛵 Rento</h1>
      </div>
      <div style="padding:32px">
        <h2>Verification ${status === 'approved' ? 'Approved!' : 'Rejected'}</h2>
        <p>Hi <strong>${user.first_name}</strong>,</p>
        ${status === 'approved'
          ? '<p>Your identity has been <strong style="color:green">verified</strong>. You can now book vehicles on Rento!</p>'
          : `<p>Unfortunately your verification was <strong style="color:red">rejected</strong>.</p><p><strong>Reason:</strong> ${reason || 'Documents were unclear or invalid.'}</p><p>Please resubmit with clear, valid documents.</p>`
        }
      </div>
    </div>`,
});

module.exports = { sendEmail, bookingConfirmationEmail, verificationStatusEmail };
