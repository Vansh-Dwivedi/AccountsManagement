import React, { useState } from 'react';
import api from '../utils/api';
import './ClientInfoForm.css';

const ClientInfoForm = () => {
  const [formData, setFormData] = useState({
    // Personal Information
    fullName: '', occupation: '', spouseName: '', spouseOccupation: '',
    email: '', cellNo: '', ssn: '', spouseSSN: '', dob: '', spouseDOB: '',
    addressLine1: '', addressLine2: '', howDidYouFindUs: '', referredName: '',
    filingStatus: '', totalDependents: '',
    dependents: [{ name: '', ssn: '', dob: '', relation: '' }],

    // Business Information
    businessName: '', businessPhone: '', businessAddressLine1: '', businessAddressLine2: '',
    businessEntityType: '', businessTIN: '', businessSOS: '', businessEDD: '',
    businessAccountingMethod: '', businessYear: '', businessEmail: '',
    contactPersonName: '', noOfEmployeesActive: '', businessReferredBy: '',
    members: [{ name: '', ssn: '', cellPhone: '', position: '' }],

    // Service Requested
    serviceRequested: []
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleDependentChange = (index, field, value) => {
    const newDependents = [...formData.dependents];
    newDependents[index][field] = value;
    setFormData(prevState => ({
      ...prevState,
      dependents: newDependents
    }));
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...formData.members];
    newMembers[index][field] = value;
    setFormData(prevState => ({
      ...prevState,
      members: newMembers
    }));
  };

  const handleServiceChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      serviceRequested: checked
        ? [...prevState.serviceRequested, value]
        : prevState.serviceRequested.filter(service => service !== value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      if (formData[key] === '' && key !== 'dependents' && key !== 'members') {
        newErrors[key] = 'This field is required';
      }
    });

    formData.dependents.forEach((dep, index) => {
      Object.keys(dep).forEach(field => {
        if (dep[field] === '') {
          newErrors[`dependent-${index}-${field}`] = 'This field is required';
        }
      });
    });

    formData.members.forEach((mem, index) => {
      Object.keys(mem).forEach(field => {
        if (mem[field] === '') {
          newErrors[`member-${index}-${field}`] = 'This field is required';
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    // Implement save functionality (e.g., save to local storage)
    localStorage.setItem('clientInfoFormData', JSON.stringify(formData));
    alert('Form data saved');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await api.post('/api/client-info', formData);
        alert('Form submitted successfully');

        // Notify all admins about the submission
        await api.post('/api/notify-admins', { message: 'New Client Info Form Submission' });

        // Reset form or redirect user
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('Error submitting form. Please try again.');
      }
    } else {
      alert('Please fill in all required fields');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="client-info-form">
      <h2>Personal Information</h2>

      {/* Personal Information Fields */}
      <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" required />
      <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} placeholder="Occupation" required />
      <input type="text" name="spouseName" value={formData.spouseName} onChange={handleChange} placeholder="Spouse Name" />
      <input type="text" name="spouseOccupation" value={formData.spouseOccupation} onChange={handleChange} placeholder="Spouse Occupation" />
      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Best Email" required />
      <input type="text" name="cellNo" value={formData.cellNo} onChange={handleChange} placeholder="Cell No" required />
      <input type="text" name="ssn" value={formData.ssn} onChange={handleChange} placeholder="SSN" required />
      <input type="text" name="spouseSSN" value={formData.spouseSSN} onChange={handleChange} placeholder="Spouse SSN" />
      <input type="date" name="dob" value={formData.dob} onChange={handleChange} placeholder="DOB" required />
      <input type="date" name="spouseDOB" value={formData.spouseDOB} onChange={handleChange} placeholder="Spouse DOB" />
      <input type="text" name="addressLine1" value={formData.addressLine1} onChange={handleChange} placeholder="Address Line 1" required />
      <input type="text" name="addressLine2" value={formData.addressLine2} onChange={handleChange} placeholder="Address Line 2" />
      <input type="text" name="howDidYouFindUs" value={formData.howDidYouFindUs} onChange={handleChange} placeholder="How did you find us?" />
      <input type="text" name="referredName" value={formData.referredName} onChange={handleChange} placeholder="Referred Name" />
      <input type="text" name="filingStatus" value={formData.filingStatus} onChange={handleChange} placeholder="Filing Status" required />
      <input type="number" name="totalDependents" value={formData.totalDependents} onChange={handleChange} placeholder="Total Dependents" />

      {/* Dependent Details */}
      {formData.dependents.map((dep, index) => (
        <div key={index}>
          <h3>Dependent {index + 1}</h3>
          <input type="text" value={dep.name} onChange={(e) => handleDependentChange(index, 'name', e.target.value)} placeholder="Name" required />
          <input type="text" value={dep.ssn} onChange={(e) => handleDependentChange(index, 'ssn', e.target.value)} placeholder="SSN" required />
          <input type="date" value={dep.dob} onChange={(e) => handleDependentChange(index, 'dob', e.target.value)} placeholder="DOB" required />
          <input type="text" value={dep.relation} onChange={(e) => handleDependentChange(index, 'relation', e.target.value)} placeholder="Relation" required />
        </div>
      ))}

      <h2>Business Information</h2>

      {/* Business Information Fields */}
      <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Business Name" required />
      <input type="text" name="businessPhone" value={formData.businessPhone} onChange={handleChange} placeholder="Business Phone" required />
      <input type="text" name="businessAddressLine1" value={formData.businessAddressLine1} onChange={handleChange} placeholder="Business Address Line 1" required />
      <input type="text" name="businessAddressLine2" value={formData.businessAddressLine2} onChange={handleChange} placeholder="Business Address Line 2" />
      <input type="text" name="businessEntityType" value={formData.businessEntityType} onChange={handleChange} placeholder="Business Entity Type" required />
      <input type="text" name="businessTIN" value={formData.businessTIN} onChange={handleChange} placeholder="Business TIN" required />
      <input type="text" name="businessSOS" value={formData.businessSOS} onChange={handleChange} placeholder="Business SOS" />
      <input type="text" name="businessEDD" value={formData.businessEDD} onChange={handleChange} placeholder="Business EDD" />
      <input type="text" name="businessAccountingMethod" value={formData.businessAccountingMethod} onChange={handleChange} placeholder="Business Accounting Method" required />
      <input type="text" name="businessYear" value={formData.businessYear} onChange={handleChange} placeholder="Business Year" required />
      <input type="email" name="businessEmail" value={formData.businessEmail} onChange={handleChange} placeholder="Best Email" required />
      <input type="text" name="contactPersonName" value={formData.contactPersonName} onChange={handleChange} placeholder="Contact Person Name" required />
      <input type="number" name="noOfEmployeesActive" value={formData.noOfEmployeesActive} onChange={handleChange} placeholder="No of Employees Active" required />
      <input type="text" name="businessReferredBy" value={formData.businessReferredBy} onChange={handleChange} placeholder="How did you find us / Referred By?" />

      {/* Members/Shareholder Details */}
      {formData.members.map((mem, index) => (
        <div key={index}>
          <h3>Member {index + 1}</h3>
          <input type="text" value={mem.name} onChange={(e) => handleMemberChange(index, 'name', e.target.value)} placeholder="Name" required />
          <input type="text" value={mem.ssn} onChange={(e) => handleMemberChange(index, 'ssn', e.target.value)} placeholder="SSN" required />
          <input type="text" value={mem.cellPhone} onChange={(e) => handleMemberChange(index, 'cellPhone', e.target.value)} placeholder="Cell Phone" required />
          <input type="text" value={mem.position} onChange={(e) => handleMemberChange(index, 'position', e.target.value)} placeholder="Position" required />
        </div>
      ))}

      <h2>Service Requested</h2>
      <div>
        <label>
          <input type="checkbox" name="serviceRequested" value="Business Tax Return Preparation" onChange={handleServiceChange} />
          Business Tax Return Preparation
        </label>
        <label>
          <input type="checkbox" name="serviceRequested" value="Accounting Services" onChange={handleServiceChange} />
          Accounting Services
        </label>
        <label>
          <input type="checkbox" name="serviceRequested" value="Payroll Services" onChange={handleServiceChange} />
          Payroll Services
        </label>
      </div>

      <button type="button" onClick={handleSave}>Save</button>
      <button type="submit">Submit</button>
    </form>
  );
};

export default ClientInfoForm;
