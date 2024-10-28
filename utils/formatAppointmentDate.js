const formatAppointmentDate = (dateString) => {
    // console.log(dateString,"this is date ")
    const [day, month, year] = dateString.split('_');
    return new Date(year, month - 1, day).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  export default formatAppointmentDate;