/**
 * @author
 *Aregbesola Williams & Banjo Mofesola Paul
 * Chief Developer, Trending Computing Solutions
 * aregbesolaokikiolu@gmail.com
 */

// Global vars
//-----------------------------------------------
var VM;
Me = this;
Me.url_prefix = '';
ko.observable = ko.observable;


// Init
//-----------------------------------------------------
//--------Register jQuery `all attr` extension---------
(function(old) {
  $.fn.attr = function() {
    if(arguments.length === 0) {
      if(this.length === 0) {
        return null;
      }

      var obj = {};
      $.each(this[0].attributes, function() {
        if(this.specified) {
          obj[this.name] = this.value;
        }
      });
      return obj;
    }

    return old.apply(this, arguments);
  };
})($.fn.attr);
//-------Register jQuery renameAttr extension----------
jQuery.fn.extend({
  renameAttr: function( name, newName, removeData ) {
    var val;
    return this.each(function() {
      val = jQuery.attr( this, name );
      jQuery.attr( this, newName, val );
      jQuery.removeAttr( this, name );
      // remove original data
      if (removeData !== false){
        jQuery.removeData( this, name.replace('data-','') );
      }
    });
  }
});
//----------Change `ko` attribs to `data-bind`-------------
$(function() {
	$('[ko]').renameAttr('ko','data-bind');
});
//-------------Password reveal buttons-----------------
$(function() {
	$('[type=password]').next('.pswd-reveal-btn').click(function() {
		if ($(this).hasClass('active')) {
			$(this).removeClass('active');
			$(this).closest('div').find('input').attr('type', 'password');
		} else {
			$(this).addClass('active');
			$(this).closest('div').find('input').attr('type', 'text');
		}
	});
});
//--------------Viewmodel Setup------------------
$(function() {
	switch(where) {
		case 'login':
			VM = new LoginViewmodel();
			break;
		case 'add-staff':
			VM = new AddStaffViewmodel();
			break
		case 'edit-staff-info':
			VM = new EditStaffViewmodel();
			break;
		case 'manage-production-stages':
			VM = new ManageProductionStagesViewmodel();
			break;
		case 'add-inventory-item':
			VM = new AddInventoryItemViewmodel();
			break;
		case 'manage-inventory':
			VM = new ManageInventoryViewmodel();
			break;
    case 'enter-travel-info':
      VM = new EnterTravelInfoViewmodel();
      break;
    case 'manage-travel':
      VM = new ManageTravelViewmodel();
      break;
		case 'new-job':
			VM = new NewJobViewmodel();
			break;
		case 'pending-jobs': case 'completed-jobs':
			VM = new PendingJobsViewmodel(where);
			break;
		case 'system-log':
			VM = new SystemLogViewmodel();
			break;
	}
	ko.applyBindings(VM);
});
//------------Publish pending alert---------------
$(function() {
	if (typeof(alert_text) != 'undefined')
		swal({title: alert_title, text: alert_text, type: alert_type});
});


// Login Viewmodel
//-----------------------------------------------
function LoginViewmodel() {
	var lvm = this;

	// Observables
	lvm.processing	= ko.observable(false);
	lvm.username	= ko.observable('');
	lvm.pswd		= ko.observable('');

	// Event handlers
	lvm.login_clicked = function() {
		if (lvm.username() == '' || lvm.pswd() == '') swal({title: "Oops!", text: 'Some information in the form seem to be incorrect', type: 'error'});
		else {
			lvm.processing(true);
			$.post(Me.url_prefix+'lib/bg-home.php?get_request=login',
				{
					username: lvm.username(), pswd: lvm.pswd()
				}
			, function(data) {
				if (data != '') alert(data);
				else window.location.reload();
				lvm.processing(false);
			}).error(function() {
				swal('Problem logging in, check network');
				lvm.processing(false);
			});
		}
	};

	// DOM Bindings
	$('#login-form').keypress(function(e) {
		if (e.which == 13) lvm.login_clicked();
	});
}


// Add-Staff Viewmodel
//-----------------------------------------------
function AddStaffViewmodel() {
	var avm = this;

	// Observables
	avm.staff_pswd	= ko.observable();

	// Event handlers
	avm.change_pswd = function() {
		avm.staff_pswd(randomString(8));
	};
	avm.add_staff_form_submit = function() {
		if ($("input[type=checkbox]:checked").length == 0) {
			swal({title: "One more thing", text: "Select at least one permission for this person", type: 'info'});
			return false;
		}
		return true;
	};

	// Init
	//--------------Initialize Labelauty---------------
	$(function() {
		$(':checkbox').labelauty({ same_width: true });
	});
}


// Edit-Staff-Info Viewmodel
//-----------------------------------------------
function EditStaffViewmodel() {
	var evm = this;

	// Observables
	evm.staff_list 	= ko.observableArray();
	evm.selected	= ko.observable();
	evm.labelautied	= ko.observable(false);

	// Subscriptions
	evm.selected.subscribe(function(s) {
		VM.labelautied(false);
		setTimeout(function() {
			if (!VM.labelautied())	{
				$(':checkbox').labelauty({ same_width: true });
				VM.labelautied(true);
				VM.selected().roles.map(function(r) {
					$('[perm="'+spaceToUnderscore(r)+'"]').prop('checked', true);
				});
			}
			$(function() {
				$('[type=password]').next('.pswd-reveal-btn').click(function() {
					if ($(this).hasClass('active')) {
						$(this).removeClass('active');
						$(this).closest('div').find('input').attr('type', 'password');
					} else {
						$(this).addClass('active');
						$(this).closest('div').find('input').attr('type', 'text');
					}
				});
			}); }, 5);
		s.dummy_pswd = "****";
	});

	// Methods
	evm.is_selected	= function(id) {
		if (evm.selected() != null)
			return evm.selected().staff_id == id;
	};

	// Event handlers
	evm.staff_selected	= function() {
		if (evm.selected() != this) evm.selected(this);
	};
	evm.change_pswd = function() {
		evm.selected().staff_pswd = randomString(8);
		$('[name=staff_pswd]').val(evm.selected().staff_pswd);
	};
	evm.update_staff_form_submit = function() {
		if ($("input[type=checkbox]:checked").length == 0) {
			swal({title: "One more thing", text: "Select at least one permission for this person", type: 'info'});
			return false;
		}
		return true;
	};
	evm.confirm_deletion = function() {
		return confirm("Do you really want to delete this staff?");
	};

	// Init
	//------------Get Staff Details payload------------
	$.post(Me.url_prefix+'lib/bg-manage-staff.php?get_request=get-all-staff', {}
	, function(data) {
		evm.staff_list( JSON.parse(data) );
	});
}


// Manage-Production-Stages Viewmodel
//-----------------------------------------------
function ManageProductionStagesViewmodel() {
	var mvm = this;

	// Observables
	mvm.stages_list = ko.observableArray();
	mvm.selected	= ko.observable();
	mvm.processes	= ko.observableArray();

	// Subscriptions
	mvm.selected.subscribe(function(s) {
		mvm.processes.removeAll();
		s.processes.map(function(p) {
			mvm.processes.push(new mvm.production_process(p));
		});
	});

	// Objects
	mvm.production_process = function(data) {
		var pp = this;

		// Observables
		pp.uid		= ko.observable(data? ( data.uid? data.uid():data.id):'');
		pp.name		= ko.observable(data? ( data.name? data.name():data.process_name):'');
		pp.rate		= ko.observable(data? ( data.rate? data.rate():data.process_rate):0);
		pp.unit		= ko.observable(data? ( data.unit? data.unit():data.process_unit):'');
		pp.editing	= ko.observable(false);

		// Methods
		pp.remove = function() {
			VM.processes.remove(this);
		};
		pp.toggle_edit = function() {
			pp.editing(!pp.editing());
		};
	}; mvm.proc = ko.observable(new mvm.production_process());

	// Methods
	mvm.is_selected	= function(id) {
		if (mvm.selected() != null)
			return mvm.selected().id == id;
	};
	mvm.confirm_stage_deletion = function() {
		return confirm("Do you really want to delete this procurement category? All information in it would be non-retrievable.");
	};

	// Event handlers
	mvm.stage_selected	= function() {
		if (!mvm.selected() || this.id != mvm.selected().id) mvm.selected(this);
	};
	mvm.add_process = function() {
		if (mvm.proc().name() == '' || mvm.proc().rate() == '' || mvm.proc().unit() == '') {
			swal({title: "Something's wrong", text: "You cannot leave any detail empty", type: 'info'});
			return;
		}
		var exists = false;
		mvm.processes().map(function(p) {
			if (p.name().toUpperCase() == mvm.proc().name().toUpperCase()) {
				exists = true
				return;
			}
		});
		if (exists) {
			swal({title: "Hold on", text: "This procurement order exists already", type: 'info'});
			return;
		}
		mvm.processes.push(new mvm.production_process(mvm.proc()));
	};
	mvm.update_stage_form_submit = function() {
		if (mvm.processes().length == 0) {
			swal({title: "Hold on", text: "Add at least one procurement order to this category", type: 'info'});
			return false;
		}
		return confirm("Continue to update this procurement category?");
	};

	// Init
	//------------Get Stages Details payload------------
	$.post(Me.url_prefix+'lib/bg-manage-production.php?get_request=get-production-stages', {}
	, function(data) {
		mvm.stages_list( JSON.parse(data) );
	});
}

// Enter-Travel-Info Viewmodel
//-----------------------------------------------
function EnterTravelInfoViewmodel() {
	var avm = this;

	// Observables
	avm.purposes	= ko.observableArray();
	avm.selected	= ko.observable('');
	avm.travel_purpose	= ko.observable('');

	// Subscriptions
	avm.selected.subscribe(function(s) {
	});

	// Computed
	avm.is_new_purpose = ko.computed(function() {
		return avm.purposes().length == 0 || avm.selected() == '__';
	});

	// Event handlers
	avm.add_list_form_submit = function() {
		if ((!avm.is_new_purpose() && avm.selected() == '') || (avm.is_new_purpose() && avm.travel_purpose() == '')) {
			swal({title: "Hold on", text: "Specify a purpose for this travel", type: 'info'});
			return false;
		}
		return true;
	};

	// Init
	//------------Get Travel Purposes payload------------
	$.post(Me.url_prefix+'lib/bg-manage-travel.php?get_request=get-travel-purposes', {}
	, function(data) {
		avm.purposes( JSON.parse(data) );
	});
}


// Manage-Travel Viewmodel
//-----------------------------------------------
function ManageTravelViewmodel() {
	var mvm = this;

	// Observables
	mvm.purpose_lists	= ko.observableArray();
	mvm.selected		= ko.observable();
	mvm.selected_purpose	= ko.observable();
	mvm.inv_purposes		= ko.observableArray();
	mvm.travel_purpose		= ko.observable();
	//mvm.stock_changed	= ko.observable(false);
	//mvm.purpose			= ko.observable('');

	// Subscriptions
	mvm.selected.subscribe(function(c) {
		mvm.travel_purpose(c.travel_purpose);
		if (typeof(c.stock) != typeof(ko.observable)) {
			c.initial_stock = c.stock;
			c.stock = ko.observable(c.stock);
			c.stock.subscribe(function(s) {
				mvm.stock_changed(c.initial_stock != s);
			});
    }

		setTimeout('VM.selected_purpose("'+c.travel_purpose+'")', 10);
	});

  // Methods
	mvm.is_selected	= function(id) {
		if (mvm.selected() != null)
			return mvm.selected().id == id;
	};
	mvm.is_purpose_selected	= function(purpose_name) {
		if (mvm.selected() != null)
			return mvm.selected().travel_purpose == purpose_name;
	};
	mvm.confirm_record_deletion = function() {
		return confirm("Do you really want to remove this record from system? This operation cannot be undone.");
	};

	// Computed
	mvm.is_new_purpose = ko.computed(function() {
		return mvm.purpose_lists().length == 0 || mvm.selected_purpose() == '__';
	});

	// Event handlers
	mvm.list_selected	= function() {
		mvm.selected(this);
	};
	mvm.data_submitted = function() {
		if (mvm.stock_changed() && mvm.reason() == '') {
			swal({title: 'Purpose required', text: 'Please supply a reason for stock change', type: 'error'});
			return false;
		}
		if (!mvm.stock_changed()) mvm.reason = '';
		return true;
	};


	// Init
	//------------Get Travel records payload------------
	$.post(Me.url_prefix+'lib/bg-manage-travel.php?get_request=get-purpose-lists', {}
	, function(data) {
		data = JSON.parse(data);
		for (c in data) {
			w = {};
			w.purpose_name = c;
			w.travel_purpose_lists = data[c];
			mvm.purpose_lists.push(w);
			mvm.inv_purposes.push(c);
		}
	});
}



// Add-Inventory-Item Viewmodel
//-----------------------------------------------
function AddInventoryItemViewmodel() {
	var avm = this;

	// Observables
	avm.categories	= ko.observableArray();
	avm.selected	= ko.observable('');
	avm.item_cat	= ko.observable('');

	// Subscriptions
	avm.selected.subscribe(function(s) {
	});

	// Computed
	avm.is_new_cat = ko.computed(function() {
		return avm.categories().length == 0 || avm.selected() == '__';
	});

	// Event handlers
	avm.add_item_form_submit = function() {
		if ((!avm.is_new_cat() && avm.selected() == '') || (avm.is_new_cat() && avm.item_cat() == '')) {
			swal({title: "Hold on", text: "Specify a category for this item", type: 'info'});
			return false;
		}
		return true;
	};

	// Init
	//------------Get Inventory Categories payload------------
	$.post(Me.url_prefix+'lib/bg-manage-inventory.php?get_request=get-inventory-categories', {}
	, function(data) {
		avm.categories( JSON.parse(data) );
	});
}


// Manage-Inventory Viewmodel
//-----------------------------------------------
function ManageInventoryViewmodel() {
	var mvm = this;

	// Observables
	mvm.inventory_items	= ko.observableArray();
	mvm.selected		= ko.observable();
	mvm.selected_cat	= ko.observable();
	mvm.inv_cats		= ko.observableArray();
	mvm.item_cat		= ko.observable();
	mvm.stock_changed	= ko.observable(false);
	mvm.purpose			= ko.observable('');

	// Subscriptions
	mvm.selected.subscribe(function(c) {
		mvm.item_cat(c.item_cat);
		if (typeof(c.stock) != typeof(ko.observable)) {
			c.initial_stock = c.stock;
			c.stock = ko.observable(c.stock);
			c.stock.subscribe(function(s) {
				mvm.stock_changed(c.initial_stock != s);
			});
		}
		setTimeout('VM.selected_cat("'+c.item_cat+'")', 10);
	});

	// Methods
	mvm.is_selected	= function(id) {
		if (mvm.selected() != null)
			return mvm.selected().id == id;
	};
	mvm.is_cat_selected	= function(cat_name) {
		if (mvm.selected() != null)
			return mvm.selected().item_cat == cat_name;
	};
	mvm.confirm_item_deletion = function() {
		return confirm("Do you really want to remove this item from inventory? This operation cannot be undone.");
	};

	// Computed
	mvm.is_new_cat = ko.computed(function() {
		return mvm.inventory_items().length == 0 || mvm.selected_cat() == '__';
	});

	// Event handlers
	mvm.item_selected	= function() {
		mvm.selected(this);
	};
	mvm.data_submitted = function() {
		if (mvm.stock_changed() && mvm.purpose() == '') {
			swal({title: 'Purpose required', text: 'Please supply a reason for stock change', type: 'error'});
			return false;
		}
		if (!mvm.stock_changed()) mvm.purpose = '';
		return true;
	};

	// Init
	//------------Get Inventory Items payload------------
	$.post(Me.url_prefix+'lib/bg-manage-inventory.php?get_request=get-inventory-items', {}
	, function(data) {
		data = JSON.parse(data);
		for (c in data) {
			w = {};
			w.cat_name = c;
			w.cat_items = data[c];
			mvm.inventory_items.push(w);
			mvm.inv_cats.push(c);
		}
	});
}


// New Job Viewmodel
//-----------------------------------------------
function NewJobViewmodel() {
	var nvm = this;

	// Observables
	nvm.production_stages	= ko.observableArray();
	nvm.clients				= ko.observableArray();
	nvm.discount			= ko.observable(0);
	nvm.deposit				= ko.observable(0);
	nvm.profit				= ko.observable(0);
	nvm.handling_charges	= ko.observable(0);
	nvm.sales_comm			= ko.observable(0);
	nvm.client_name			= ko.observable('');
	nvm.client_add			= ko.observable('');
	nvm.client_phone		= ko.observable('');
	nvm.order_desc			= ko.observable('');
	nvm.order_submitted		= ko.observable(false);
	nvm.job_id				= ko.observable('');
	nvm.order_date			= ko.observable('');
	nvm.todays_date			= ko.observable('');
	nvm.processing			= ko.observable(false);
	nvm.selected_client		= ko.observable();

	// Instance
	nvm.vat					= ko.observable('0');

	// Computed
	nvm.lump_sum = ko.computed(function() {
		var sum = 0;
		nvm.production_stages().map(function(s) {
			sum += parseFloat(s.total().replace(/,/g,''));
		});

		nvm.profit( isNaN(parseFloat(nvm.profit())) || parseFloat(nvm.profit()) < 0? 0:nvm.profit() );
		nvm.handling_charges( isNaN(parseFloat(nvm.handling_charges())) || parseFloat(nvm.handling_charges()) < 0? 0:nvm.handling_charges() );
		nvm.sales_comm( isNaN(parseFloat(nvm.sales_comm())) || parseFloat(nvm.sales_comm()) < 0? 0:nvm.sales_comm() );

		sum += parseFloat(nvm.profit()) + parseFloat(nvm.handling_charges()) + parseFloat(nvm.sales_comm());
		return sum == 0? '0.00':addCommas(parseFloat(sum).toFixed(2));
	});
	nvm.final_cost = ko.computed(function() {
		nvm.discount( isNaN(parseFloat(nvm.discount())) || parseFloat(nvm.discount()) < 0? 0:nvm.discount() );
		var sum = (nvm.lump_sum().replace(/,/g,'') - nvm.discount()); //+ parseFloat(nvm.vat().replace(/,/g,''));
		return sum == 0? '0.00':addCommas(parseFloat(sum).toFixed(2));
	});
	nvm.balance = ko.computed(function() {
		nvm.deposit( isNaN(parseFloat(nvm.deposit())) || parseFloat(nvm.deposit()) < 0? 0:nvm.deposit() );
		var sum = nvm.final_cost().replace(/,/g,'') - nvm.deposit();
		return sum == 0? '0.00':addCommas(parseFloat(sum).toFixed(2));
	});
	nvm.vat = ko.computed(function() {
		var cost = (nvm.lump_sum().replace(/,/g,'') - nvm.discount()) * .05;
		return addCommas(parseFloat(cost).toFixed(2));
	});
	nvm.receipt_handling = ko.computed(function() {
		return addCommas( parseFloat(nvm.handling_charges()) + parseFloat(nvm.sales_comm()) );
	});

	// Events
	nvm.input_cleared		= ko.observable(false);
	nvm.confirm_submission	= ko.observable(false);

	// Subscriptions
	nvm.selected_client.subscribe(function(c) {
		if (c) {
			nvm.client_name(c.name);
			nvm.client_add(c.add);
			nvm.client_phone(c.phone);
		} else {
			nvm.client_name('');
			nvm.client_add('');
			nvm.client_phone('');
		}
	});
	nvm.confirm_submission.subscribe(function() {
		payload = [];
		nvm.production_stages().map(function(s) {
			if (s.total() != '0.00') {
				obj = {
					stage_name: s.stage_name(),
					processes: [],
					total: s.total()
				};
				s.processes().map(function(p) {
					if (p.qty() != null && p.qty() != '0' && p.qty() != 0 && p.qty() != '') {
						proc = {
							process_name: p.process_name(),
							qty: p.qty(),
							price: p.price(),
							process_unit: p.process_unit()
						};
						obj.processes.push(proc);
					}
				});
				payload.push(obj);
			}
		});
		nvm.job_id($('[name=job_id]').val());

		var order_digest = {
			job_id: 			nvm.job_id(),
			client_name: 		nvm.client_name(),
			client_address: 	nvm.client_add(),
			client_phone:		nvm.client_phone(),
			job_description:	nvm.order_desc(),
			order_payload:		JSON.stringify(payload),
			job_estimate:		nvm.lump_sum().replace(/,/g,''),
			discount:			nvm.discount(),
			reimbursement:		nvm.deposit(),
			last_instalment:	nvm.deposit(),
			handling_charges:	nvm.handling_charges(),
			sales_comm:			nvm.sales_comm(),
			profit:				nvm.profit(),
			vat:				nvm.vat().replace(/,/g,'')
		};

		nvm.processing(true);
		$.post(Me.url_prefix+'lib/bg-frontdesk.php?get_request=submit-order', order_digest
		, function(data) {
			if (data == '') swal({title: 'Order failed', text: 'Error occurred while processing order, please try again', type: 'error'});
			else {
				data = data.split('+');

				nvm.job_id(data[0]);
				nvm.order_date(data[1]);

				nvm.order_submitted(true);
				setTimeout("swal({title: 'Order successful', text: 'Order has been submitted successfully. You can now raise invoice and print receipt', type: 'success'})", 100);
			}
			nvm.processing(false);
		}).error(function() {
			nvm.processing(false);
			alert("Failed to place new order");
		});
	});

	// Event handlers
	nvm.save_order = function() {
		if (!nvm.order_submitted()) {
			if
				(nvm.discount() > parseFloat(nvm.lump_sum().replace(/,/g,''))) swal({title: 'Invalid discount', text: 'Discount cannot be greater than lump sum', type: 'error'});
			/*else if
				(nvm.deposit() > parseFloat(nvm.final_cost().replace(/,/g,''))) swal({title: 'Hold on', text: 'Deposit is greater than final cost', type: 'error'});*/
			else {
				ordered = false;
				ordered = nvm.lump_sum() != '0.00';
				if (!ordered) swal({title: 'Invalid order', text: 'You have not selected any production process', type: 'error'});
				else {
					if (nvm.client_phone() != '' && nvm.client_phone().length != 11) {
						if (!confirm("Something looks wrong with that phone number, if you think it's correct, click ok")) return
					}
					swal({title: 'Verify Order', text: "Once you submit this order, you won't be able to modify it. Ensure everything is correct before proceeding.", type: 'info', showCancelButton: true, confirmButtonText: 'Submit Order', cancelButtonText: 'Check again'},
						function(isConfirm) {
							if (isConfirm) VM.confirm_submission(!VM.confirm_submission());
						});
				}
			}
		}
	};
	nvm.clear_input = function() {
		nvm.input_cleared( !nvm.input_cleared() );
	};
	nvm.collapse_all = function() {
		$('td.collapse.in').collapse('hide');
	};
	nvm.expand_all = function() {
		$('td.collapse:not(.in)').collapse('show');
	};
	nvm.print_receipt = function(o) {
		$.post(Me.url_prefix+'lib/bg-frontdesk.php?get_request=generate-receipt', { id: nvm.job_id() }
		, function(data) {
			nvm.todays_date(data);
			nvm.expand_all();
			setTimeout('window.print()', 500);
		}).error(function() {
			alert("Error occurred while generating receipt, try again");
		});
	};
	nvm.raise_invoice = function(o) {
		$.post(Me.url_prefix+'lib/bg-frontdesk.php?get_request=raise-invoice', { id: nvm.job_id() }
		, function(data) {
			nvm.todays_date(data);
			nvm.expand_all();
			setTimeout('window.print()', 500);
		}).error(function() {
			alert("Error occurred while raising invoice, try again");
		});
	};
	nvm.page_reload = function() {
		swal({title: 'Are you sure', text: "Do you really want to reset this page? All information you entered will be cleared.", type: 'info', showCancelButton: true, confirmButtonText: 'Proceed', cancelButtonText: 'Cancel'},
					function(isConfirm) {
						if (isConfirm) window.location = window.location;
					});
	};

	// Objects
	nvm.production_stage = function(data) {
		var ps = this;

		// Observable
		for (i in data) if (i != 'processes') ps[i] = ko.observable(data[i]);
		ps.processes = ko.observableArray();

		// Computed
		ps.total = ko.computed(function() {
			var total = 0;
			ps.processes().map(function(p) {
				total += parseFloat(p.price().replace(/,/g,''));
			});
			return total == 0? '0.00':addCommas(total);
		});

		// Init
		data.processes.map(function(p) {
			ps.processes.push(new nvm.production_process(p));
		});
	};
	nvm.production_process = function(data) {
		var pp = this;

		// Observables
		for (i in data) pp[i] = ko.observable(data[i]);
		pp.qty = ko.observable();

		// Subscriptions
		VM.input_cleared.subscribe(function() {
			pp.qty('');
		});

		// Computed
		pp.price = ko.computed(function() {
			if (pp.qty() == null || pp.qty() == '' || pp.qty() == 0) return '0.00';
			return addCommas(parseFloat(parseFloat(pp.qty()) * parseFloat(pp.process_rate())));
		});
	};

	// Init
	//-----------Get production payload----------
	$.post(Me.url_prefix+'lib/bg-frontdesk.php?get_request=get-production-payload', {}
	, function(data) {
		data = JSON.parse(data);
		data.production.map(function(d) {
			nvm.production_stages.push(new nvm.production_stage(d));
		});
		nvm.clients(data.clients);
	});
}


// Pending Jobs Viewmodel
//-----------------------------------------------
function PendingJobsViewmodel(where) {
	var pvm = this;

	// Observables
	pvm.jobs						= ko.observableArray();
	pvm.selected					= ko.observable();
	pvm.todays_date 				= ko.observable();
	pvm.viewing_revenue_overview	= ko.observable(false);

	// Subscriptions
	pvm.selected.subscribe(function(j) {
		if (j == null) return;
		j.order = JSON.parse(j.order_payload);
		s = parseFloat(j.last_instalment == 0? j.reimbursement:j.last_instalment).toFixed(2).toString().split('.');
		j.paid_whole_part = s[0];
		j.paid_decimal_part = s[1];
		j.balance = ((parseFloat(j.job_estimate) - parseFloat(j.discount)) - parseFloat(j.reimbursement)).toFixed(2); // + parseFloat(j.vat))
		j.final_cost = (parseFloat(j.job_estimate) - parseFloat(j.discount)).toFixed(2); // + parseFloat(j.vat)
		pvm.viewing_revenue_overview(false);
	});

	// Methods
	pvm.is_selected	= function(id) {
		if (pvm.selected() != null)
			return pvm.selected().job_id == id;
	};

	// Event handlers
	pvm.job_selected	= function() {
		if (pvm.selected() != this) pvm.selected(this);
	};
	pvm.print_receipt = function() {
		$.post(Me.url_prefix+'lib/bg-frontdesk.php?get_request=generate-receipt', { id: pvm.selected().job_id }
		, function(data) {
			pvm.todays_date(data);

			$('.not-receipt').hide();
			$('.receipt').show();
			$('.main-container').addClass('print-receipt-body');

			window.print();

			$('.not-receipt').show();
			$('.receipt').hide();
			$('.main-container').removeClass('print-receipt-body');

		}).error(function() {
			alert("Error occurred while generating receipt, try again");
		});
	};
	pvm.raise_invoice = function(o) {
		$.post(Me.url_prefix+'lib/bg-frontdesk.php?get_request=raise-invoice', { id: pvm.selected().job_id }
		, function(data) {
			pvm.todays_date(data);
			$('.receipt').addClass('print-hidden');
			window.print();
			$('.receipt').removeClass('print-hidden');
		}).error(function() {
			alert("Error occurred while raising invoice, try again");
		});
	};
	pvm.toggle_revenue_overview = function() {
		pvm.viewing_revenue_overview(!pvm.viewing_revenue_overview());
		if (pvm.viewing_revenue_overview()) pvm.selected(null);
	};
	pvm.cancel_job_order = function(o,e) {
		url = Me.url_prefix+where+'?cancel='+o.job_id;
		swal({title: 'Are you sure', text: "Do you really want to cancel this order? This action cannot be undone.", type: 'info', showCancelButton: true, confirmButtonText: 'Yes', cancelButtonText: 'No'},
					function(isConfirm) {
						if (isConfirm) window.location = url;
					});
		return false;
	};

	// Init
	//-----------Get production payload----------
	$.post(Me.url_prefix+'lib/bg-frontdesk.php?get_request=get-'+where, {}
	, function(data) {
		data = JSON.parse(data);
		pvm.jobs(data);
	});
}



// System Log Viewmodel
//-----------------------------------------------
function SystemLogViewmodel() {
	var svm = this;

	// Observables
	svm.log_titles	= ko.observableArray();
	svm.selected	= ko.observable();
	svm.busy		= ko.observable(false);
	svm.log_data	= ko.observableArray();

	// Subscriptions
	svm.selected.subscribe(function(s) {
		setTimeout('VM.fetch_log_data("'+s.label+'")', 250);
	});

	// Methods
	svm.is_selected	= function(label) {
		if (svm.selected() != null)
			return svm.selected().label == label;
	};
	svm.fetch_log_data = function(label) {
		svm.busy(true);
		$.post(Me.url_prefix+'lib/bg-system-log.php?get_request=get-log-data', { label: label }
		, function(data) {
			data = JSON.parse(data);
			svm.log_data(data);
			svm.busy(false);
		}).error(function() {
			swal({title:'', text:"Error fetching log data", type: error});
			svm.busy(false);
		});
	};
	svm.refresh_data = function() {
		svm.fetch_log_data(svm.selected().label);
	};

	// Event handlers
	svm.log_selected = function() {
		if (!svm.busy() && svm.selected() != this) svm.selected(this);
		if (svm.busy()) swal({title:'', text:"System is busy, try again"});
	};

	// Init
	//-----------Get log titles payload----------
	$.post(Me.url_prefix+'lib/bg-system-log.php?get_request=get-log-titles', {}
	, function(data) {
		data = JSON.parse(data);
		svm.log_titles(data);
	});
}


// Helper Methods
//-----------------------------------------------------
//--------------Random String Generator----------------
function randomString(len, charSet) {
    charSet = charSet || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
}
//--------------------JS var_dump----------------------
function dump(obj) {
    var out = '';
    for (var i in obj) {
        out += i + ": " + obj[i] + "\n";
    }

    return out;
}
//-------------Change Spaces To Underscore--------------
function spaceToUnderscore(txt) {
	txt = txt.replace(/\s/g, '_');
	txt = txt.replace(/[^A-z0-9\-]/g, '_');
	return txt;
}
//-----------------Add commas to number-----------------
function addCommas(s) {
	s += '';
	x = s.split('.');
	x1 = x[0];
	x2 = x.length > 1? '.'+x[1]:'';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) x1 = x1.replace(rgx, '$1' + ',' + '$2');
	return x1 + x2;
}
