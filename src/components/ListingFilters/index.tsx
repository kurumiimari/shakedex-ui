import React from 'react';
import DatePicker from 'react-datepicker';
import {useDispatch, useSelector} from 'react-redux';
import {fetchRemoteAuctions, Filters, FilterStatus, setFilterField, State} from '../../ducks/auctions';
import Icon from '../Icon';
import c from 'classnames';

interface ListingFiltersProps {
  isVisible: boolean
  page: number
  search: string
  toggle: (v: boolean) => void
}

export const ListingFilters = (props: ListingFiltersProps) => {
  const filters = useSelector((state: { auctions: State}) => state.auctions.filters);
  const dispatch = useDispatch();

  const genSetFilterField = (field: keyof Filters) => {
    return (value: any) => dispatch(setFilterField(field, value))
  }

  const genSetFilterStatus = (status: FilterStatus) => {
    return (value: boolean) => {
      let clone = [...filters.statuses];
      if (value) {
        clone.push(status);
      } else {
        clone = clone.filter(s => s !== status);
      }
      dispatch(setFilterField('statuses', clone));
    }
  }

  return (
    <div>
      <div>
        <button
          className={
            c(
              'border border-gray-700 bg-gray-700 rounded-sm py-2 pl-3 pr-4 text-sm text-gray-400 flex align-center',
              {
                'border-pink-500 text-pink-500': props.isVisible
              }
            )
          }
          onClick={() => props.toggle(!props.isVisible)}
        >
          <Icon
            material="filter_alt"
            size={1.5}
          />
          Filters
        </button>
      </div>
      {props.isVisible && (
        <div className="p-4 bg-gray-700 rounded-sm mt-2">
          <div className="mb-4 grid grid-cols-2 gap-4 text-gray-200">
            <div>
              <div className="text-sm text-gray-400 mb-2 font-bold">Name Types</div>
              <div className="mb-2">
                <Checkbox
                  title="Include Punycode Names"
                  checked={filters.includePunycode}
                  onChange={genSetFilterField('includePunycode')}
                />
              </div>
              <div className="mb-4">
                <Checkbox
                  title="Include ASCII Names"
                  checked={filters.includeAscii}
                  onChange={genSetFilterField('includeAscii')}
                />
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-2 font-bold">Auction Status</div>
              <div className="mb-2">
                <Checkbox
                  title="Active"
                  checked={filters.statuses.includes('ACTIVE')}
                  onChange={genSetFilterStatus('ACTIVE')}
                />
              </div>
              <div className="mb-2">
                <Checkbox
                  title="Completed"
                  checked={filters.statuses.includes('COMPLETED')}
                  onChange={genSetFilterStatus('COMPLETED')}
                />
              </div>
              <div className="mb-4">
                <Checkbox
                  title="Cancelled"
                  checked={filters.statuses.includes('CANCELLED')}
                  onChange={genSetFilterStatus('CANCELLED')}
                />
              </div>
            </div>
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 text-gray-200">
            <div>
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div>
                  <div className="text-sm text-gray-400 mb-2 font-bold">Min Length</div>
                  <Input
                    value={filters.minLength.toString()}
                    onChange={genSetFilterField('minLength')}
                    transform={Number}
                  />
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm text-gray-400 mb-2 font-bold">Max Length</div>
                  <Input
                    value={filters.maxLength.toString()}
                    onChange={genSetFilterField('maxLength')}
                    transform={Number}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2 font-bold">Min Current Bid</div>
                  <Input
                    value={(filters.minCurrentBid / 1e6).toString()}
                    onChange={genSetFilterField('minCurrentBid')}
                    transform={(v) => Number(v) * 1e6}
                  />
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm text-gray-400 mb-2 font-bold">Max Current Bid</div>
                  <Input
                    value={(filters.maxCurrentBid / 1e6).toString()}
                    onChange={genSetFilterField('maxCurrentBid')}
                    transform={(v) => Number(v) * 1e6}
                  />
                </div>
              </div>
            </div>
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-2 font-bold">Created After</div>
                  <DatePicker
                    selected={filters.after ? new Date(filters.after) : null}
                    onChange={(date: Date) => dispatch(setFilterField('after', date.getTime()))}
                    className="w-full border border-gray-600 bg-gray-600 text-md text-gray-200 px-1"
                  />
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-2 font-bold">Created Before</div>
                  <DatePicker
                    selected={filters.before ? new Date(filters.before) : null}
                    onChange={(date: Date) => dispatch(setFilterField('before', date.getTime()))}
                    className="w-full border border-gray-600 bg-gray-600 text-md text-gray-200 px-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <button
            className="bg-pink-500 px-2 py-1 font-bold rounded-sm"
            onClick={() => dispatch(fetchRemoteAuctions(props.page, props.search))}
          >
            Save Filters
          </button>
        </div>
      )}
    </div>
  );
};

interface InputProps {
  placeholder?: string
  value: string
  onChange: (v: any) => void
  transform?: (v: string) => any
}

const Input = (props: InputProps) => {
  const transform = props.transform || ((v) => v);

  return (
    <input
      type="text"
      className="w-full border border-gray-600 bg-gray-600 text-md text-gray-200 px-1"
      placeholder={props.placeholder}
      value={props.value}
      onChange={(e) => props.onChange(transform(e.target.value))}
    />
  )
}

const Checkbox = (props: { title: string, checked: boolean, onChange: (v: boolean) => void }) => {
  return (
    <div className="flex items-center text-sm">
      <input
        type="checkbox"
        className="mr-2"
        checked={props.checked}
        onChange={(e) => props.onChange(e.target.checked)}
      />
      <div>
        {props.title}
      </div>
    </div>
  );
};

export default ListingFilters;